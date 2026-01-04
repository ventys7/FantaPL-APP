import { useState, useMemo, useEffect } from 'react';
import { Calendar, Filter, Clock, ChevronRight, RefreshCw, Shield } from 'lucide-react'; // Shield imported from lucide
import { MatchSheet } from '../components/MatchSheet';
import { useFixtures, Fixture } from '../hooks/useFixtures';
import { FixtureCard } from '../components/fixtures/FixtureCard';
import { PremierLeagueHeader } from '../components/fixtures/PremierLeagueHeader';

export function Fixtures() {
    const { fixtures, loading, refreshing, lastUpdate, activeGameweek } = useFixtures();

    const [selectedGameweek, setSelectedGameweek] = useState<number>(1);
    const [showLiveOnly, setShowLiveOnly] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);

    // Sync gameweek when loaded
    useEffect(() => {
        if (activeGameweek > 0) {
            setSelectedGameweek(activeGameweek);
        }
    }, [activeGameweek]);

    const [isPLOpen, setIsPLOpen] = useState(false);
    const [isFantaOpen, setIsFantaOpen] = useState(false);
    const [lastOpened, setLastOpened] = useState<'PL' | 'Fanta' | null>(null);

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

    const hasLiveMatches = useMemo(() => fixtures.some(f => f.status === 'IN_PLAY'), [fixtures]);

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

    // Convert for MatchSheet
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

    return (
        <div className="h-[100dvh] w-full bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark overflow-hidden flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-4 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-2 md:mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-pl-pink" />
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-3xl md:text-4xl font-bold text-white">Calendario</h1>
                        </div>
                    </div>
                    {/* Last update indicator */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                        {refreshing && <RefreshCw className="w-3 h-3 animate-spin" />}
                        {lastUpdate && (
                            <span>Aggiornato: {lastUpdate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                    </div>
                </div>

                {/* Main Content: Split View */}
                <div className="flex flex-col md:flex-row gap-2 md:gap-8 flex-1 min-h-0">

                    {/* Premier League Fixtures */}
                    <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-auto md:h-full">
                        <PremierLeagueHeader
                            isPLOpen={isPLOpen}
                            setIsPLOpen={setIsPLOpen}
                            setLastOpened={setLastOpened}
                            hasLiveMatches={hasLiveMatches}
                            showLiveOnly={showLiveOnly}
                            setShowLiveOnly={setShowLiveOnly}
                            selectedGameweek={selectedGameweek}
                            setSelectedGameweek={setSelectedGameweek}
                            isMobile={window.innerWidth < 768}
                        />

                        {/* Fixtures List */}
                        <div className={`overflow-y-auto custom-scrollbar bg-black/10 transition-all duration-500 ease-in-out ${isPLOpen ? (isFantaOpen && lastOpened === 'Fanta' ? 'max-h-[25vh]' : 'max-h-[55vh]') : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100 md:flex-1 md:block`}>
                            <div className="p-2 space-y-2">
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
                                        <FixtureCard
                                            key={match.id}
                                            match={match}
                                            onClick={setSelectedMatch}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FantaPL Matches (Placeholder) */}
                    <div className="order-1 md:order-2 w-full md:w-1/2 flex flex-col bg-gradient-to-br from-pl-purple/20 to-pl-pink/10 backdrop-blur-lg rounded-2xl border border-pl-pink/30 overflow-hidden h-auto md:h-full">
                        <div
                            className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0 cursor-pointer md:cursor-default"
                            onClick={() => {
                                const newState = !isFantaOpen;
                                setIsFantaOpen(newState);
                                if (newState) setLastOpened('Fanta');
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-pl-pink" />
                                <h2 className="text-xl font-bold text-white">FantaPL</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-pl-pink font-bold">GAMEWEEK {selectedGameweek}</span>
                                {/* Mobile Accordion Icon */}
                                <div className="md:hidden">
                                    <ChevronRight className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isFantaOpen ? 'rotate-90' : ''}`} />
                                </div>
                            </div>
                        </div>

                        <div className={`overflow-y-auto space-y-3 custom-scrollbar transition-all duration-500 ease-in-out ${isFantaOpen ? (isPLOpen && lastOpened === 'PL' ? 'max-h-[25vh]' : 'max-h-[55vh]') : 'max-h-0 opacity-0'} md:max-h-none md:opacity-100 md:block md:p-4 md:flex-1`}>
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
