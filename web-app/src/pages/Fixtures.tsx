import { useEffect, useState, useMemo } from 'react';
import { Calendar, Trophy, Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { databases, COLL_FIXTURES, COLL_TEAMS, client } from '../lib/appwrite';
import { Query } from 'appwrite';

interface PLTeam {
    $id: string;
    name: string;
    logo_url?: string;
    short_name: string;
}

interface PLFixture {
    $id: string;
    external_id: number;
    gameweek: number;
    home_team_id: string;
    away_team_id: string;
    date: string;
    status: string; // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED
    home_score: number | null;
    away_score: number | null;
    minute: number | null;
    season: number; // Added season
    home_team?: PLTeam;
    away_team?: PLTeam;
}

export function Fixtures() {
    const [fixtures, setFixtures] = useState<PLFixture[]>([]);
    const [teams, setTeams] = useState<Map<string, PLTeam>>(new Map());
    const [loading, setLoading] = useState(true);
    const [selectedGameweek, setSelectedGameweek] = useState<number>(1);
    const [selectedSeason, setSelectedSeason] = useState<number>(2025); // Default to current season
    const [showLiveOnly, setShowLiveOnly] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);

                // 1. Fetch ALL Teams (Only 20, efficient to cache)
                const teamsResponse = await databases.listDocuments(
                    'fantapl_db',
                    COLL_TEAMS,
                    [Query.limit(100)]
                );
                const teamsMap = new Map(teamsResponse.documents.map(d => [d.$id, d as unknown as PLTeam]));
                setTeams(teamsMap);

                // 2. Fetch Fixtures (Limit 1000 to cover multiple seasons if needed)
                const fixturesResponse = await databases.listDocuments(
                    'fantapl_db',
                    COLL_FIXTURES,
                    [
                        Query.orderAsc('date'),
                        Query.limit(1000)
                    ]
                );

                const rawFixtures = fixturesResponse.documents.map(d => d as unknown as PLFixture);
                setFixtures(rawFixtures);

                // 3. Determine "Current" Gameweek based on SELECTED season (defaults to 2025)
                // We'll update this whenever season changes effectively, but for initial load:
                const currentSeasonFixtures = rawFixtures.filter(f => f.season === 2025);
                const nextMatch = currentSeasonFixtures.find(f => f.status !== 'FINISHED');
                if (nextMatch) {
                    setSelectedGameweek(nextMatch.gameweek);
                } else {
                    const maxGw = Math.max(...currentSeasonFixtures.map(f => f.gameweek), 1);
                    setSelectedGameweek(maxGw);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
        fetchAllData();
    }, []);

    // REALTIME SUBSCRIPTION
    useEffect(() => {
        const unsubscribe = client.subscribe(
            `databases.fantapl_db.collections.${COLL_FIXTURES}.documents`,
            (response) => {
                if (response.events.includes('databases.*.collections.*.documents.*.update')) {
                    const updatedFixture = response.payload as unknown as PLFixture;

                    // Only update if it helps (optimization)
                    setFixtures(currentFixtures =>
                        currentFixtures.map(f =>
                            f.$id === updatedFixture.$id ? { ...f, ...updatedFixture } : f
                        )
                    );
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    // Filter and Sort Logic
    const filteredFixtures = useMemo(() => {
        let filtered = fixtures.filter(f => f.season === selectedSeason);

        if (showLiveOnly) {
            filtered = filtered.filter(f => f.status === 'IN_PLAY' || f.status === 'PAUSED');
        } else {
            // Filter by Gameweek
            filtered = filtered.filter(f => f.gameweek === selectedGameweek);
        }

        // Enrich with team data
        return filtered.map(f => ({
            ...f,
            home_team: teams.get(f.home_team_id),
            away_team: teams.get(f.away_team_id)
        }));
    }, [fixtures, teams, selectedGameweek, selectedSeason, showLiveOnly]);

    // Format Helpers
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit' }),
            time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        };
    };

    const renderMatchStatus = (match: PLFixture) => {
        if (match.status === 'FINISHED') {
            return (
                <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                    <span className="font-bold text-white text-lg">{match.home_score} - {match.away_score}</span>
                    <div className="text-[10px] text-gray-400 font-mono text-center">FT</div>
                </div>
            );
        }
        if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
            return (
                <div className="bg-pl-pink/20 px-3 py-1 rounded-lg border border-pl-pink/30 animate-pulse-slow flex flex-col items-center min-w-[70px]">
                    <span className="font-bold text-pl-pink text-lg leading-none">{match.home_score} - {match.away_score}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pl-pink animate-pulse" />
                        <span className="text-[10px] text-pl-pink font-bold tracking-wider">
                            {match.minute ? `${match.minute}'` : 'LIVE'}
                        </span>
                    </div>
                </div>
            );
        }
        // Scheduled
        const { time } = formatDate(match.date);
        return (
            <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 min-w-[60px] flex items-center justify-center">
                <span className="text-gray-300 font-mono text-sm">{time}</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark py-4 md:py-8 px-4 h-[100dvh] overflow-hidden flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-pl-pink" />
                        <h1 className="text-3xl md:text-4xl font-bold text-white">Calendario</h1>
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full min-h-0">

                    {/* Premier League Fixtures (Left Desktop / Bottom Mobile) */}
                    <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

                        {/* Header Controls */}
                        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-3 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-pl-teal" />
                                    <div className="flex flex-col">
                                        <h2 className="text-xl font-bold text-white leading-none">Premier League</h2>

                                        {/* Season Selector */}
                                        <div className="flex items-center gap-2 mt-1">
                                            <button
                                                onClick={() => setSelectedSeason(2025)}
                                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${selectedSeason === 2025 ? 'bg-pl-teal text-pl-dark font-bold' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                25/26
                                            </button>
                                            <button
                                                onClick={() => setSelectedSeason(2024)}
                                                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${selectedSeason === 2024 ? 'bg-pl-teal text-pl-dark font-bold' : 'bg-white/10 text-gray-400 hover:text-white'}`}
                                            >
                                                24/25
                                            </button>
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
                                    <p className="text-gray-500 animate-pulse text-sm">Sincronizzazione dati...</p>
                                </div>
                            ) : filteredFixtures.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center px-6">
                                    <Filter className="w-8 h-8 text-gray-600 mb-2" />
                                    <p className="text-gray-400 italic">Nessuna partita trovata {showLiveOnly ? 'in diretta' : `per la giornata ${selectedGameweek} (Stagione ${selectedSeason})`}.</p>
                                </div>
                            ) : (
                                filteredFixtures.map((match, idx) => {
                                    // Group by Date Header logic
                                    const prevMatch = filteredFixtures[idx - 1];
                                    const currentDate = formatDate(match.date).day;
                                    const prevDate = prevMatch ? formatDate(prevMatch.date).day : null;
                                    const showHeader = currentDate !== prevDate;

                                    return (
                                        <div key={match.$id}>
                                            {showHeader && !showLiveOnly && (
                                                <div className="sticky top-0 z-10 bg-[#1f0029]/95 backdrop-blur py-1.5 px-3 text-xs font-bold text-gray-400 uppercase tracking-widest border-y border-white/5 shadow-sm">
                                                    {currentDate}
                                                </div>
                                            )}
                                            <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all group mb-2 mx-1 relative overflow-hidden">
                                                {/* Hover Effect Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                                                {/* Home Team */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <span className="text-sm font-semibold text-white truncate text-right w-full hidden sm:block">
                                                        {match.home_team?.short_name || match.home_team?.name || 'Home'}
                                                    </span>
                                                    <span className="text-sm font-semibold text-white truncate text-right w-full sm:hidden">
                                                        {match.home_team?.short_name || 'HOM'}
                                                    </span>
                                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10 shadow-inner">
                                                        {match.home_team?.logo_url ? (
                                                            <img src={match.home_team.logo_url} alt="H" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold">{match.home_team?.short_name?.[0]}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Score / Status */}
                                                <div className="mx-3 shrink-0">
                                                    {renderMatchStatus(match)}
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10 shadow-inner">
                                                        {match.away_team?.logo_url ? (
                                                            <img src={match.away_team.logo_url} alt="A" className="w-full h-full object-contain" />
                                                        ) : (
                                                            <span className="text-[10px] font-bold">{match.away_team?.short_name?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-semibold text-white truncate text-left w-full hidden sm:block">
                                                        {match.away_team?.short_name || match.away_team?.name || 'Away'}
                                                    </span>
                                                    <span className="text-sm font-semibold text-white truncate text-left w-full sm:hidden">
                                                        {match.away_team?.short_name || 'AWY'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* FantaPL Matches (Right Desktop / Top Mobile) */}
                    <div className="order-1 md:order-2 w-full md:w-1/2 flex flex-col bg-gradient-to-br from-pl-purple/20 to-pl-pink/10 backdrop-blur-lg rounded-2xl border border-pl-pink/30 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-pl-pink" />
                                <h2 className="text-xl font-bold text-white">FantaPL</h2>
                            </div>
                            <span className="text-xs text-pl-pink font-bold">GAMEWEEK 24</span>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <div className="text-center py-10">
                                <p className="text-gray-300 italic">Nessuna sfida in programma per questa giornata.</p>
                            </div>
                            {/* TODO: Map Fanta Matches here */}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Fix missing import
function Shield({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
        </svg>
    );
}
