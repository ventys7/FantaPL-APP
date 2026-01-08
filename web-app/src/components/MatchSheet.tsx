import { useState, useEffect, useCallback } from 'react';
import { X, Shirt, RefreshCw, AlertCircle } from 'lucide-react';
import { functions } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { ExecutionMethod } from 'appwrite';
import { usePlayers } from '../hooks/usePlayers';
import { PlayerRow } from './matchsheet/PlayerRow';
import { LineupsData, TeamLineup, MatchEvent, FantasyPlayerData } from '../types/matchsheet';

const FETCH_LINEUPS_FUNCTION_ID = '6959a2f4001012412402';

interface MatchSheetProps {
    fixture: any;
    teams: Map<string, any>;
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

    // Render formation
    const renderFormation = (teamLineup: TeamLineup | null) => {
        if (!teamLineup?.lineup) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-gray-400 italic">
                    <Shirt className="w-8 h-8 mb-2 opacity-20" />
                    Lineup not available
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-2">
                <div className="text-center text-xs font-bold bg-white/5 py-1 rounded mb-2">
                    {teamLineup.formation || 'Unknown Formation'}
                </div>
                {/* Starters */}
                <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Starters</h4>
                    {teamLineup.lineup.map(p => (
                        <PlayerRow
                            key={p.id}
                            player={p}
                            isBench={false}
                            events={getPlayerEvents(p.id)}
                            minutesPlayed={calculateMinutesPlayed(p.id, false)}
                            fantasyData={getFantasyPlayerData(p.id)}
                        />
                    ))}
                </div>
                {/* Bench */}
                <div className="space-y-1 mt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Bench</h4>
                    {teamLineup.bench.map(p => (
                        <PlayerRow
                            key={p.id}
                            player={p}
                            isBench={true}
                            events={getPlayerEvents(p.id)}
                            minutesPlayed={calculateMinutesPlayed(p.id, true)}
                            fantasyData={getFantasyPlayerData(p.id)}
                        />
                    ))}
                </div>
            </div>
        );
    };

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
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-pl-pink">Match Center</span>
                            </h2>
                            <span className="text-xs text-gray-400">
                                {new Date(fixture.date).toLocaleString(undefined, {
                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchLineups}
                            disabled={loading}
                            className={`p-2 rounded-full hover:bg-white/10 transition ${loading ? 'animate-spin text-pl-teal' : 'text-gray-400'}`}
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Scoreboard */}
                <div className="flex flex-col bg-gradient-to-r from-[#37003c] to-[#1f0029] border-b border-white/10 shrink-0">
                    <div className="flex items-start justify-between p-6 md:p-3 md:pb-3">
                        {/* Home Team & Goals */}
                        <div className="flex flex-col items-center justify-start w-1/3">
                            {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                            <span className="font-bold text-white text-center leading-tight mb-2 min-h-[2.5em] flex items-center justify-center">{homeTeam?.name}</span>
                            <div className="flex flex-col items-center gap-1 w-full">
                                {lineups?.events
                                    ?.filter(e => (e.isHome || e.team?.name === homeTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                                    .map(renderGoalScorer)}
                            </div>
                        </div>

                        {/* Result & Status */}
                        <div className="flex flex-col items-center pt-4 w-1/3">
                            <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter text-center">
                                {fixture.home_score ?? 0} - {fixture.away_score ?? 0}
                            </div>
                            <div className="mt-2 px-3 py-1 bg-white/10 rounded text-xs font-bold text-pl-teal uppercase tracking-widest text-center">
                                {fixture.status === 'IN_PLAY' || fixture.status === 'PAUSED' ? `${fixture.minute}'` : fixture.status}
                            </div>
                        </div>

                        {/* Away Team & Goals */}
                        <div className="flex flex-col items-center justify-start w-1/3">
                            {awayTeam?.logo_url && <img src={awayTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                            <span className="font-bold text-white text-center leading-tight mb-2 min-h-[2.5em] flex items-center justify-center">{awayTeam?.name}</span>
                            <div className="flex flex-col items-center gap-1 w-full">
                                {lineups?.events
                                    ?.filter(e => (!e.isHome && e.team?.name !== homeTeam?.name || e.team?.name === awayTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                                    .map(renderGoalScorer)}
                            </div>
                        </div>
                    </div>
                </div>

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
                            {renderFormation(lineups?.home || null)}
                        </div>
                        <div className={`bg-[#18181b] p-4 md:border-l border-white/5 ${activeTab === 'away' ? 'block' : 'hidden md:block'}`}>
                            {renderFormation(lineups?.away || null)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
