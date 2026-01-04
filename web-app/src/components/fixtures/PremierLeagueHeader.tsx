import { Trophy, ChevronRight, ChevronLeft } from 'lucide-react';

interface PremierLeagueHeaderProps {
    isPLOpen: boolean;
    setIsPLOpen: (open: boolean) => void;
    setLastOpened: (section: 'PL' | 'Fanta') => void;
    hasLiveMatches: boolean;
    showLiveOnly: boolean;
    setShowLiveOnly: (show: boolean) => void;
    selectedGameweek: number;
    setSelectedGameweek: (gw: number) => void;
    isMobile: boolean;
}

export function PremierLeagueHeader({
    isPLOpen,
    setIsPLOpen,
    setLastOpened,
    hasLiveMatches,
    showLiveOnly,
    setShowLiveOnly,
    selectedGameweek,
    setSelectedGameweek,
    isMobile
}: PremierLeagueHeaderProps) {
    return (
        <div
            className="p-4 border-b border-white/10 bg-white/5 flex flex-col gap-3 shrink-0 cursor-pointer md:cursor-default"
            onClick={() => {
                const newState = !isPLOpen;
                setIsPLOpen(newState);
                if (newState) setLastOpened('PL');
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-pl-teal" />
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-white leading-none">Premier League</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasLiveMatches && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const newState = !showLiveOnly;

                                if (newState) {
                                    // Opening: Immediate
                                    setShowLiveOnly(true);
                                    setIsPLOpen(true);
                                    setLastOpened('PL');
                                } else {
                                    // Closing
                                    setIsPLOpen(false);
                                    // On mobile, delay the data switch so the accordion closes first
                                    if (isMobile) {
                                        setTimeout(() => setShowLiveOnly(false), 500);
                                    } else {
                                        setShowLiveOnly(false);
                                    }
                                }
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${showLiveOnly
                                ? 'bg-pl-pink text-white border-pl-pink shadow-[0_0_10px_rgba(255,40,130,0.5)]'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30 animate-pulse-slow'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${showLiveOnly || !showLiveOnly ? 'bg-pl-pink animate-pulse' : 'bg-gray-500'}`} />
                            <span className="hidden sm:inline">LIVE NOW</span>
                            <span className="sm:hidden">LIVE</span>
                        </button>
                    )}


                    {/* Mobile Accordion Icon */}
                    <div className="md:hidden">
                        <ChevronRight className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isPLOpen ? 'rotate-90' : ''}`} />
                    </div>
                </div>
            </div>

            {/* Mobile Controls (Only visible when open) */}
            <div
                className={`md:block overflow-hidden transition-all duration-300 ${isPLOpen ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0 md:max-h-none md:opacity-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {!showLiveOnly && (
                    <div className={`flex items-center justify-between bg-black/20 rounded-lg p-1 transition-opacity duration-200 ${!isPLOpen ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
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
        </div>
    );
}
