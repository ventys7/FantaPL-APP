import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, Trophy, Clock, Filter, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { functions } from '../lib/appwrite';
import { ExecutionMethod } from 'appwrite';
import { MatchSheet } from '../components/MatchSheet';

const GET_PL_FIXTURES_FUNCTION_ID = '695a6d7100173e92ccfd';

interface Fixture {
    id: string;
    gameweek: number;
    date: string;
    status: string;
    minute: string | null;
    home: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    away: {
        id: string;
        name: string;
        shortName: string;
        logo: string;
    };
    homeScore: number | null;
    awayScore: number | null;
}

export function Fixtures() {
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedGameweek, setSelectedGameweek] = useState<number>(1);
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Fetch fixtures from the proxy function
    const fetchFixtures = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const execution = await functions.createExecution(
                GET_PL_FIXTURES_FUNCTION_ID,
                JSON.stringify({}), // Get all fixtures
                false,
                '/',
                ExecutionMethod.POST
            );

            const response = JSON.parse(execution.responseBody);

            if (response.success && response.fixtures) {
                setFixtures(response.fixtures);
                setLastUpdate(new Date());

                // Auto-select current gameweek on first load
                if (!silent && response.fixtures.length > 0) {
                    const nextMatch = response.fixtures.find((f: Fixture) => f.status !== 'FINISHED');
                    if (nextMatch) {
                        setSelectedGameweek(nextMatch.gameweek);
                    } else {
                        const maxGw = Math.max(...response.fixtures.map((f: Fixture) => f.gameweek), 1);
                        setSelectedGameweek(maxGw);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching fixtures:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchFixtures();
    }, [fetchFixtures]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchFixtures(true); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchFixtures]);

    // Filter fixtures
    const filteredFixtures = useMemo(() => {
        let filtered = fixtures;

        if (showLiveOnly) {
            filtered = filtered.filter(f => f.status === 'IN_PLAY');
        } else {
            filtered = filtered.filter(f => f.gameweek === selectedGameweek);
        }

        return filtered;
    }, [fixtures, selectedGameweek, showLiveOnly]);

    // Check if there are any live matches
    const hasLiveMatches = useMemo(() => {
        return fixtures.some(f => f.status === 'IN_PLAY');
    }, [fixtures]);

    const renderMatchStatus = (match: Fixture) => {
        if (match.status === 'FINISHED') {
            return (
                <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                    <span className="font-bold text-white text-lg">{match.homeScore} - {match.awayScore}</span>
                    <div className="text-[10px] text-gray-400 font-mono text-center">FT</div>
                </div>
            );
        }
        if (match.status === 'IN_PLAY') {
            return (
                <div className="bg-pl-pink/20 px-3 py-1 rounded-lg border border-pl-pink/30 animate-pulse-slow flex flex-col items-center min-w-[70px]">
                    <span className="font-bold text-pl-pink text-lg leading-none">{match.homeScore} - {match.awayScore}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pl-pink animate-pulse" />
                        <span className="text-[10px] text-pl-pink font-bold tracking-wider">
                            {match.minute || 'LIVE'}
                        </span>
                    </div>
                </div>
            );
        }
        // Scheduled
        const time = new Date(match.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        return (
            <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 min-w-[60px] flex items-center justify-center">
                <span className="text-gray-300 font-mono text-sm">{time}</span>
            </div>
        );
    };

    // Convert Fixture to the format MatchSheet expects
    const convertForMatchSheet = (match: Fixture) => ({
        $id: `match_${match.id}`,
        external_id: match.id,
        gameweek: match.gameweek,
        home_team_id: `team_${match.home.id}`,
        away_team_id: `team_${match.away.id}`,
        date: match.date,
        status: match.status,
        home_score: match.homeScore,
        away_score: match.awayScore,
        minute: match.minute ? parseInt(match.minute) : null,
        season: 2025
    });

    // Create a teams map for MatchSheet
    const teamsMap = useMemo(() => {
        const map = new Map();
        fixtures.forEach(f => {
            map.set(`team_${f.home.id}`, {
                $id: `team_${f.home.id}`,
                name: f.home.name,
                short_name: f.home.shortName,
                logo_url: f.home.logo
            });
            map.set(`team_${f.away.id}`, {
                $id: `team_${f.away.id}`,
                name: f.away.name,
                short_name: f.away.shortName,
                logo_url: f.away.logo
            });
        });
        return map;
    }, [fixtures]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark py-4 md:py-8 px-4 h-[100dvh] overflow-hidden flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-pl-pink" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Calendario</h1>
                    </div>
                    {/* Last update indicator */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {refreshing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {lastUpdate && (
                            <span>Aggiornato: {lastUpdate.toLocaleTimeString('it-IT')}</span>
                        )}
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full min-h-0">

                    {/* Premier League Fixtures */}
                    <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

                        {/* Header Controls */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-pl-teal" />
                                    <div className="flex flex-col">
                                        <h2 className="text-xl font-bold text-white leading-none">Premier League</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-pl-teal text-pl-dark font-bold">
                                                25/26
                                            </span>
                                            {hasLiveMatches && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-pl-pink/20 text-pl-pink font-bold animate-pulse">
                                                    🔴 LIVE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowLiveOnly(!showLiveOnly)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${showLiveOnly
                                        ? 'bg-pl-pink text-white border-pl-pink shadow-[0_0_10px_rgba(255,40,130,0.5)]'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${showLiveOnly ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
                                    LIVE NOW
                                </button>
                            </div>

                            {!showLiveOnly && (
                                <div className="flex items-center justify-between bg-black/20 rounded-lg p-1">
                                    <button
                                        onClick={() => setSelectedGameweek(Math.max(1, selectedGameweek - 1))}
                                        className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-bold text-pl-teal tracking-widest uppercase">
                                        Giornata {selectedGameweek}
                                    </span>
                                    <button
                                        onClick={() => setSelectedGameweek(Math.min(38, selectedGameweek + 1))}
                                        className="p-1 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Fixtures List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-black/10">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <Clock className="w-8 h-8 text-pl-teal animate-spin" />
                                    <p className="text-gray-500 animate-pulse text-sm">Caricamento da FotMob...</p>
                                </div>
                            ) : filteredFixtures.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                                    <Filter className="w-8 h-8 text-gray-600 mb-2" />
                                    <p className="text-gray-400 italic">
                                        {showLiveOnly ? 'Nessuna partita in diretta' : `Nessuna partita per la giornata ${selectedGameweek}`}
                                    </p>
                                </div>
                            ) : (
                                filteredFixtures.map((match) => (
                                    <div
                                        key={match.id}
                                        onClick={() => setSelectedMatch(match)}
                                        className="cursor-pointer"
                                    >
                                        <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all group mb-2 mx-1 relative overflow-hidden">
                                            {/* Hover Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                            {/* Home Team */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-sm font-semibold text-white truncate text-right w-full hidden sm:block">
                                                    {match.home.shortName}
                                                </span>
                                                <span className="text-sm font-semibold text-white truncate text-right w-full sm:hidden">
                                                    {match.home.shortName.substring(0, 3).toUpperCase()}
                                                </span>
                                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10">
                                                    <img src={match.home.logo} alt="" className="w-full h-full object-contain" />
                                                </div>
                                            </div>

                                            {/* Score / Status / Date */}
                                            <div className="mx-3 shrink-0 flex flex-col items-center gap-1">
                                                {renderMatchStatus(match)}
                                                <span className="text-[10px] text-gray-500 font-mono uppercase">
                                                    {new Date(match.date).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Away Team */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10">
                                                    <img src={match.away.logo} alt="" className="w-full h-full object-contain" />
                                                </div>
                                                <span className="text-sm font-semibold text-white truncate text-left w-full hidden sm:block">
                                                    {match.away.shortName}
                                                </span>
                                                <span className="text-sm font-semibold text-white truncate text-left w-full sm:hidden">
                                                    {match.away.shortName.substring(0, 3).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* FantaPL Matches (Placeholder) */}
                    <div className="order-1 md:order-2 w-full md:w-1/2 flex flex-col bg-gradient-to-br from-pl-purple/20 to-pl-pink/10 backdrop-blur-lg rounded-2xl border border-pl-pink/30 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-pl-pink" />
                                <h2 className="text-xl font-bold text-white">FantaPL</h2>
                            </div>
                            <span className="text-xs text-pl-pink font-bold">GAMEWEEK {selectedGameweek}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <div className="text-center py-10">
                                <p className="text-gray-300 italic">Nessuna sfida in programma per questa giornata.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Match Detail Modal */}
            {selectedMatch && (
                <MatchSheet
                    fixture={convertForMatchSheet(selectedMatch)}
                    teams={teamsMap}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
}

// Shield Icon Component
function Shield({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    );
}
