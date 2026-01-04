import { useState, useEffect } from 'react';
import { X, Shirt, RefreshCw, AlertCircle } from 'lucide-react';
import { functions } from '../lib/appwrite';
import { ExecutionMethod } from 'appwrite';

const FETCH_LINEUPS_FUNCTION_ID = '6959a2f4001012412402'; // v1 deployed

interface MatchSheetProps {
    fixture: any;
    teams: Map<string, any>;
    onClose: () => void;
}

export function MatchSheet({ fixture, teams, onClose }: MatchSheetProps) {
    const [loading, setLoading] = useState(false);
    const [lineups, setLineups] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');

    const homeTeam = teams.get(fixture.home_team_id);
    const awayTeam = teams.get(fixture.away_team_id);

    // Initial Load & ESC Key Listener
    useEffect(() => {
        // Handle ESC Key
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);

        // Load Data
        if (fixture.lineups) {
            try {
                // If stored as JSON string
                const parsed = typeof fixture.lineups === 'string'
                    ? JSON.parse(fixture.lineups)
                    : fixture.lineups;
                setLineups(parsed);
            } catch (e) {
                console.error("Error parsing stored lineups", e);
            }
        } else {
            // Auto-fetch ONLY if match is live/finished to avoid spamming API for scheduled matches
            if (fixture.status === 'IN_PLAY' || fixture.status === 'FINISHED' || fixture.status === 'PAUSED') {
                fetchLineups();
            }
        }

        return () => window.removeEventListener('keydown', handleEsc);
    }, [fixture, onClose]);

    const fetchLineups = async () => {
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
                console.log('📋 Lineups received:', response.lineups);
                setLineups(response.lineups);
            } else {
                // If API says "No lineup data", show it
                if (response.message) {
                    setError(`${response.message}`);
                } else {
                    // Check for Rate Limit (Axios 429 inside function)
                    if (response.error && response.error.includes('429')) {
                        setError('Rate Limit Exceeded (API Free Tier). Please wait 1 minute.');
                    } else {
                        setError(response.error || 'Failed to fetch lineups');
                    }
                }
            }
        } catch (err: any) {
            // Check for Appwrite Rate Limit
            if (err.code === 429) {
                setError('Too many requests. Please wait a moment.');
            } else {
                setError(err.message || "Connection failed");
            }
        } finally {
            setLoading(false);
        }
    };

    const renderFormation = (teamLineup: any, isHome: boolean) => {
        if (!teamLineup || !teamLineup.lineup) return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 italic">
                <Shirt className="w-8 h-8 mb-2 opacity-20" />
                Lineup not available
            </div>
        );

        // Helper to find events for a player
        const getPlayerEvents = (playerId: number) => {
            if (!lineups?.events) return null;
            return lineups.events.filter((e: any) => e.player?.id === playerId);
        };

        const renderPlayerRow = (p: any, isBench: boolean = false) => {
            const events = getPlayerEvents(p.id);

            // Match Duration (default 90 if not provided)
            const matchDuration = lineups?.meta?.totalDuration || 90;

            // Calculate Effective Minutes
            let minutesPlayed = 0;

            // Find relevant events
            // Note: Events are sorted by time usually, but we filter by player ID
            const subIn = events?.find((e: any) => e.type === 'SubIn');
            const subOut = events?.find((e: any) => e.type === 'SubOut');
            const redCard = events?.find((e: any) => e.type === 'Card' && (e.detail === 'Red' || e.detail === 'YellowRed'));

            if (!isBench) {
                // STARTER logic
                if (subOut) {
                    minutesPlayed = subOut.time.elapsed;
                } else if (redCard) {
                    minutesPlayed = redCard.time.elapsed;
                } else {
                    minutesPlayed = matchDuration;
                }
            } else {
                // BENCH logic
                if (subIn) {
                    const startTime = subIn.time.elapsed;
                    let endTime = matchDuration;

                    if (subOut) {
                        endTime = subOut.time.elapsed;
                    } else if (redCard) {
                        endTime = redCard.time.elapsed;
                    }

                    minutesPlayed = Math.max(0, endTime - startTime);
                }
            }

            // Append minutes to events list just for rendering? No, render separate badge.

            return (
                <div key={p.id} className={`flex items-center gap-3 ${isBench ? 'p-1.5' : 'p-2 bg-white/5'} rounded hover:bg-white/10 transition group`}>
                    {/* Image & Number */}
                    <div className="relative">
                        {p.image ? (
                            <img src={p.image} alt={p.name} className={`rounded-full object-cover bg-gray-800 ${isBench ? 'w-6 h-6' : 'w-8 h-8'}`} onError={(e) => (e.currentTarget.style.display = 'none')} />
                        ) : (
                            <div className={`rounded-full bg-gray-800 flex items-center justify-center ${isBench ? 'w-6 h-6' : 'w-8 h-8'}`}>
                                <Shirt className="w-1/2 h-1/2 opacity-50" />
                            </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 bg-black/80 font-mono text-pl-teal text-[10px] px-1 rounded ${isBench ? 'text-[9px]' : ''}`}>
                            {p.number}
                        </div>
                    </div>

                    {/* Name & Events */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`font-semibold truncate ${isBench ? 'text-gray-400 group-hover:text-white text-xs' : 'text-sm'}`}>{p.name}</span>
                                {/* Inline Events Icons */}
                                {events && events.map((e: any, i: number) => {
                                    // Event types: Goal, OwnGoal, Card, SubIn, SubOut, Assist, PenaltySaved
                                    const isGoal = e.type === 'Goal';
                                    const isOwnGoal = e.type === 'OwnGoal';
                                    const isYellow = e.type === 'Card' && e.detail === 'Yellow' && !e.secondYellow;
                                    const isSecondYellow = e.type === 'Card' && (e.secondYellow || e.detail === 'YellowRed');
                                    const isRed = e.type === 'Card' && e.detail === 'Red' && !e.secondYellow;
                                    const isSubIn = e.type === 'SubIn';
                                    const isSubOut = e.type === 'SubOut';
                                    const isAssist = e.type === 'Assist';
                                    const isPenaltyMissed = e.type === 'PenaltyMissed';
                                    const isPenaltySaved = e.type === 'PenaltySaved';

                                    return (
                                        <div key={i} title={`${e.type} (${e.time?.elapsed}')`} className="flex-shrink-0 flex items-center">
                                            {isGoal && <span className="text-xs">⚽</span>}
                                            {isOwnGoal && <span className="text-xs">⚽🔴</span>}
                                            {isYellow && <div className="w-2 h-3 bg-yellow-400 rounded-[1px]" />}
                                            {isSecondYellow && (
                                                <div className="flex">
                                                    <div className="w-2 h-3 bg-yellow-400 rounded-[1px]" />
                                                    <div className="w-2 h-3 bg-red-600 rounded-[1px] -ml-0.5" />
                                                </div>
                                            )}
                                            {isRed && <div className="w-2 h-3 bg-red-600 rounded-[1px]" />}
                                            {isSubIn && <span className="text-xs text-green-400">↑</span>}
                                            {isSubOut && <span className="text-xs text-red-400">↓</span>}
                                            {isAssist && <span className="text-xs text-blue-400">🅰️</span>}
                                            {isPenaltyMissed && <span className="text-xs">❌</span>}
                                            {isPenaltySaved && <span className="text-xs">🧤</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Effective Minutes Badge */}
                            {(minutesPlayed > 0) && (
                                <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${isBench ? 'bg-green-900/40 border-green-500/30 text-green-400' : 'bg-white/10 border-white/20 text-gray-300'}`} title={`Played ${minutesPlayed} minutes`}>
                                    {minutesPlayed}'
                                </div>
                            )}
                        </div>
                        {!isBench && <span className="text-[10px] text-gray-500">{p.position}</span>}
                    </div>
                </div>
            )
        };

        return (
            <div className="flex flex-col gap-2">
                <div className="text-center text-xs font-bold bg-white/5 py-1 rounded mb-2">
                    {teamLineup.formation || 'Unknown Formation'}
                </div>
                {/* Starters */}
                <div className="space-y-1">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Starters</h4>
                    {teamLineup.lineup.map((p: any) => renderPlayerRow(p, false))}
                </div>
                {/* Bench */}
                <div className="space-y-1 mt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Bench</h4>
                    {teamLineup.bench.map((p: any) => renderPlayerRow(p, true))}
                </div>
            </div>
        );
    };

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
                                {new Date(fixture.date).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
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

                {/* Scoreboard and Footer Events */}
                <div className="flex flex-col bg-gradient-to-r from-[#37003c] to-[#1f0029] border-b border-white/10 shrink-0">
                    <div className="flex items-start justify-between p-6 pb-6">
                        {/* Home Team & Goals */}
                        <div className="flex flex-col items-center justify-start w-1/3">
                            {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                            <span className="font-bold text-white text-center leading-tight mb-2 min-h-[2.5em] flex items-center justify-center">{homeTeam?.name}</span>

                            {/* Home Goals (Unified) */}
                            <div className="flex flex-col items-center gap-1 w-full">
                                {lineups?.events
                                    ?.filter((e: any) => (e.isHome || e.team?.name === homeTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                                    .map((e: any, i: number) => (
                                        <div key={i} className="text-xs md:text-base font-medium text-white/90 whitespace-nowrap text-center">
                                            {e.type === 'OwnGoal' && <span className="text-red-400">(AG) </span>}
                                            {e.player?.name?.split(' ').pop()} <span className="text-pl-teal opacity-80 font-mono">
                                                {e.time.elapsed}{e.time.extra ? `+${e.time.extra}` : ''}'
                                            </span>
                                        </div>
                                    ))
                                }
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

                            {/* Away Goals (Unified) */}
                            <div className="flex flex-col items-center gap-1 w-full">
                                {lineups?.events
                                    ?.filter((e: any) => (!e.isHome && e.team?.name !== homeTeam?.name || e.team?.name === awayTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                                    .map((e: any, i: number) => (
                                        <div key={i} className="text-xs md:text-base font-medium text-white/90 whitespace-nowrap text-center">
                                            {e.type === 'OwnGoal' && <span className="text-red-400">(AG) </span>}
                                            {e.player?.name?.split(' ').pop()} <span className="text-pl-teal opacity-80 font-mono">
                                                {e.time.elapsed}{e.time.extra ? `+${e.time.extra}` : ''}'
                                            </span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Tabs (Fixed) */}
                <div className="md:hidden flex border-b border-white/10 shrink-0 bg-[#18181b] z-20">
                    <button
                        onClick={() => setActiveTab('home')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'home' ? 'bg-[#18181b] text-white border-b-2 border-pl-teal' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                    >
                        {homeTeam?.short_name || 'Home'}
                    </button>
                    <button
                        onClick={() => setActiveTab('away')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'away' ? 'bg-[#18181b] text-white border-b-2 border-pl-teal' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
                    >
                        {awayTeam?.short_name || 'Away'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f11] relative">
                    {error && (
                        <div className="sticky top-0 z-10 flex items-center gap-2 p-4 bg-red-500/10 text-red-400 text-sm border-b border-red-500/20 backdrop-blur-md">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="md:grid md:grid-cols-2 gap-px bg-white/5 min-h-full pb-8">
                        {/* Home Lineup - Show if Desktop OR (Mobile AND ActiveTab is Home) */}
                        <div className={`bg-[#18181b] p-4 ${activeTab === 'home' ? 'block' : 'hidden md:block'}`}>
                            {renderFormation(lineups?.home, true)}
                        </div>
                        {/* Away Lineup - Show if Desktop OR (Mobile AND ActiveTab is Away) */}
                        <div className={`bg-[#18181b] p-4 md:border-l border-white/5 ${activeTab === 'away' ? 'block' : 'hidden md:block'}`}>
                            {renderFormation(lineups?.away, false)}
                        </div>
                    </div>
                </div>

            </div >
        </div >
    );
}
