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
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold truncate ${isBench ? 'text-gray-400 group-hover:text-white text-xs' : 'text-sm'}`}>{p.name}</span>
                            {/* Inline Events Icons */}
                            {events && events.map((e: any, i: number) => (
                                <div key={i} title={`${e.type} (${e.time.elapsed}')`} className="flex-shrink-0">
                                    {e.type === 'Goal' && <span className="text-xs">⚽</span>}
                                    {e.detail === 'Yellow Card' && <div className="w-2 h-3 bg-yellow-400 rounded-[1px]" />}
                                    {e.detail === 'Red Card' && <div className="w-2 h-3 bg-red-600 rounded-[1px]" />}
                                    {e.type === 'Sub' && <span className="text-xs text-pl-teal">⇄</span>}
                                </div>
                            ))}
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4" onClick={onClose}>
            <div
                className="bg-[#18181b] w-full max-w-4xl md:rounded-2xl h-[90vh] md:h-[80vh] flex flex-col border border-white/10 shadow-2xl overflow-hidden animate-slide-up"
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
                                {new Date(fixture.date).toLocaleString()}
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
                    <div className="flex items-center justify-between p-6 pb-2">
                        <div className="flex flex-col items-center w-1/3">
                            {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                            <span className="font-bold text-white text-center leading-tight">{homeTeam?.name}</span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter">
                                {fixture.home_score ?? 0} - {fixture.away_score ?? 0}
                            </div>
                            <div className="mt-2 px-3 py-1 bg-white/10 rounded text-xs font-bold text-pl-teal uppercase tracking-widest">
                                {fixture.status === 'IN_PLAY' || fixture.status === 'PAUSED' ? `${fixture.minute}'` : fixture.status}
                            </div>
                        </div>

                        <div className="flex flex-col items-center w-1/3">
                            {awayTeam?.logo_url && <img src={awayTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                            <span className="font-bold text-white text-center leading-tight">{awayTeam?.name}</span>
                        </div>
                    </div>

                    {/* Goal Summary (Center Aligned) */}
                    {lineups?.events && (
                        <div className="grid grid-cols-2 gap-8 px-8 pb-6 text-sm text-white/90">
                            {/* Home Goals (Right Aligned text for center feel relative to divider) - wait user said "Left Home, Right Away" */}
                            {/* Actually standard is: Home | Away. Let's do Home Left, Away Right. */}
                            <div className="text-right space-y-1 border-r border-white/10 pr-4">
                                {Object.entries(
                                    lineups.events
                                        .filter((e: any) => (e.isHome || e.team?.name === homeTeam?.name) && e.type === 'Goal')
                                        .reduce((acc: any, e: any) => {
                                            const name = e.player?.name || 'Unknown';
                                            if (!acc[name]) acc[name] = [];
                                            acc[name].push(e);
                                            return acc;
                                        }, {})
                                ).map(([name, events]: [string, any], i) => (
                                    <div key={i} className="flex items-center justify-end gap-2">
                                        <span className="font-semibold">{name}</span>
                                        <span className="text-xs text-pl-teal opacity-80 font-mono">
                                            {events.map((e: any) => `${e.time.elapsed}'${e.time.extra ? `+${e.time.extra}` : ''}`).join(', ')}
                                        </span>
                                        <span className="text-xs">⚽</span>
                                    </div>
                                ))}
                            </div>

                            {/* Away Goals (Left Aligned text) */}
                            <div className="text-left space-y-1 pl-4">
                                {Object.entries(
                                    lineups.events
                                        .filter((e: any) => (!e.isHome && e.team?.name !== homeTeam?.name || e.team?.name === awayTeam?.name) && e.type === 'Goal')
                                        .reduce((acc: any, e: any) => {
                                            const name = e.player?.name || 'Unknown';
                                            if (!acc[name]) acc[name] = [];
                                            acc[name].push(e);
                                            return acc;
                                        }, {})
                                ).map(([name, events]: [string, any], i) => (
                                    <div key={i} className="flex items-center justify-start gap-2">
                                        <span className="text-xs">⚽</span>
                                        <span className="font-semibold">{name}</span>
                                        <span className="text-xs text-pl-teal opacity-80 font-mono">
                                            {events.map((e: any) => `${e.time.elapsed}'${e.time.extra ? `+${e.time.extra}` : ''}`).join(', ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f11] relative">
                    {error && (
                        <div className="sticky top-0 z-10 flex items-center gap-2 p-4 bg-red-500/10 text-red-400 text-sm border-b border-red-500/20 backdrop-blur-md">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-px bg-white/5 min-h-full pb-8">
                        {/* Home Lineup */}
                        <div className="bg-[#18181b] p-4">
                            {renderFormation(lineups?.home, true)}
                        </div>
                        {/* Away Lineup */}
                        <div className="bg-[#18181b] p-4 border-l border-white/5">
                            {renderFormation(lineups?.away, false)}
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
