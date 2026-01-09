import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { functions } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { ExecutionMethod } from 'appwrite';
import { usePlayers } from '../hooks/usePlayers';
import { LineupsData, MatchEvent, FantasyPlayerData } from '../types/matchsheet';
import { MatchHeader, MatchScoreboard, MatchFormation } from './matchsheet/structure';

import { Fixture, Team } from '../types/shared';

const FETCH_LINEUPS_FUNCTION_ID = '6959a2f4001012412402';

interface MatchSheetProps {
    fixture: Fixture;
    teams: Map<string, Team>;
    onClose: () => void;
}

export function MatchSheet({ fixture, teams, onClose }: MatchSheetProps) {
    const { players: fantasyPlayers } = usePlayers();
    const [loading, setLoading] = useState(false);
    const [lineups, setLineups] = useState<LineupsData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');

    const homeTeam = teams.get(fixture.home_team_id);
    const awayTeam = teams.get(fixture.away_team_id);

    // Memoized fantasy data lookup
    const getFantasyPlayerData = useCallback((fotmobPlayerId: number | string): FantasyPlayerData => {
        if (!fantasyPlayers || fantasyPlayers.length === 0) {
            return { role: null, owner: null };
        }
        const match = fantasyPlayers.find(p => String(p.fotmob_id) === String(fotmobPlayerId));
        return {
            role: match?.position || null,
            owner: match?.owner || null
        };
    }, [fantasyPlayers]);

    // Fetch lineups from API
    const fetchLineups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const execution = await functions.createExecution(
                FETCH_LINEUPS_FUNCTION_ID,
                JSON.stringify({
                    fixtureId: fixture.$id,
                    externalId: fixture.external_id,
                    date: fixture.date,
                    homeTeamName: homeTeam?.name,
                    awayTeamName: awayTeam?.name,
                    homeTeamShort: homeTeam?.short_name,
                    awayTeamShort: awayTeam?.short_name
                }),
                false,
                '/',
                ExecutionMethod.POST
            );

            const response = JSON.parse(execution.responseBody);

            if (response.success && response.lineups) {
                logger.info('[MatchSheet] Lineups received');
                setLineups(response.lineups);
            } else {
                if (response.message) {
                    setError(response.message);
                } else if (response.error?.includes('429')) {
                    setError('Rate Limit Exceeded. Please wait 1 minute.');
                } else {
                    setError(response.error || 'Failed to fetch lineups');
                }
            }
        } catch (err: any) {
            if (err.code === 429) {
                setError('Too many requests. Please wait a moment.');
            } else {
                setError(err.message || 'Connection failed');
            }
        } finally {
            setLoading(false);
        }
    }, [fixture, homeTeam, awayTeam]);

    // ESC key listener & initial load
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);

        // Load data
        if (fixture.lineups) {
            try {
                const parsed = typeof fixture.lineups === 'string'
                    ? JSON.parse(fixture.lineups)
                    : fixture.lineups;
                setLineups(parsed);
            } catch (e) {
                logger.error('[MatchSheet] Error parsing stored lineups', e);
            }
        } else if (['IN_PLAY', 'FINISHED', 'PAUSED'].includes(fixture.status)) {
            fetchLineups();
        }

        return () => window.removeEventListener('keydown', handleEsc);
    }, [fixture, onClose, fetchLineups]);

    // Get events for a specific player
    const getPlayerEvents = useCallback((playerId: number): MatchEvent[] | null => {
        if (!lineups?.events) return null;
        return lineups.events.filter(e => e.player?.id === playerId);
    }, [lineups]);

    // Calculate minutes played
    const calculateMinutesPlayed = useCallback((playerId: number, isBench: boolean): number => {
        const events = getPlayerEvents(playerId);
        const matchDuration = lineups?.meta?.totalDuration || 90;

        const subIn = events?.find(e => e.type === 'SubIn');
        const subOut = events?.find(e => e.type === 'SubOut');
        const redCard = events?.find(e => e.type === 'Card' && (e.detail === 'Red' || e.detail === 'YellowRed'));

        if (!isBench) {
            if (subOut) return subOut.time.elapsed;
            if (redCard) return redCard.time.elapsed;
            return matchDuration;
        } else {
            if (subIn) {
                const startTime = subIn.time.elapsed;
                let endTime = matchDuration;
                if (subOut) endTime = subOut.time.elapsed;
                else if (redCard) endTime = redCard.time.elapsed;
                return Math.max(0, endTime - startTime);
            }
            return 0;
        }
    }, [getPlayerEvents, lineups]);

    // Render goal scorer for scoreboard
    const renderGoalScorer = (e: MatchEvent, i: number) => (
        <div key={i} className="text-xs md:text-base font-medium text-white/90 whitespace-nowrap text-center">
            {e.type === 'OwnGoal' && <span className="text-red-400">(AG) </span>}
            {e.player?.name?.split(' ').pop()}{' '}
            <span className="text-pl-teal opacity-80 font-mono">
                {e.time.elapsed}{e.time.extra ? `+${e.time.extra}` : ''}'
            </span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-[#18181b] w-full max-w-4xl rounded-2xl h-[80vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <MatchHeader
                    date={fixture.date}
                    loading={loading}
                    onRefresh={fetchLineups}
                    onClose={onClose}
                />

                {/* Scoreboard */}
                <MatchScoreboard
                    fixture={fixture}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    events={lineups?.events || []}
                    renderGoalScorer={renderGoalScorer}
                />

                {/* Mobile Tabs */}
                <div className="md:hidden flex border-b border-white/10 shrink-0 bg-[#18181b] z-20">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'home'
                            ? 'bg-[#18181b] text-white border-b-2 border-pl-teal'
                            : 'bg-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {homeTeam?.short_name || 'Home'}
                    </button>
                    <button
                        onClick={() => setActiveTab('away')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'away'
                            ? 'bg-[#18181b] text-white border-b-2 border-pl-teal'
                            : 'bg-white/5 text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {awayTeam?.short_name || 'Away'}
                    </button>
                </div>

                {/* Lineups Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f11] relative">
                    {error && (
                        <div className="sticky top-0 z-10 flex items-center gap-2 p-4 bg-red-500/10 text-red-400 text-sm border-b border-red-500/20 backdrop-blur-md">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="md:grid md:grid-cols-2 gap-px bg-white/5 min-h-full pb-8">
                        <div className={`bg-[#18181b] p-4 ${activeTab === 'home' ? 'block' : 'hidden md:block'}`}>
                            <MatchFormation
                                teamLineup={lineups?.home || null}
                                getPlayerEvents={getPlayerEvents}
                                calculateMinutesPlayed={calculateMinutesPlayed}
                                getFantasyPlayerData={getFantasyPlayerData}
                            />
                        </div>
                        <div className={`bg-[#18181b] p-4 md:border-l border-white/5 ${activeTab === 'away' ? 'block' : 'hidden md:block'}`}>
                            <MatchFormation
                                teamLineup={lineups?.away || null}
                                getPlayerEvents={getPlayerEvents}
                                calculateMinutesPlayed={calculateMinutesPlayed}
                                getFantasyPlayerData={getFantasyPlayerData}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
