import { Calendar, Trophy } from 'lucide-react';

export function Fixtures() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark py-4 md:py-8 px-4 h-[100dvh] overflow-hidden flex flex-col">
            <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
                <div className="flex items-center gap-3 mb-4 md:mb-6 shrink-0">
                    <Calendar className="w-8 h-8 text-pl-pink" />
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Calendario</h1>
                </div>

                {/* Main Content: Split View */}
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full min-h-0">

                    {/* Premier League Fixtures (Left Desktop / Bottom Mobile) */}
                    <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-pl-teal" />
                                <h2 className="text-xl font-bold text-white">Premier League</h2>
                            </div>
                            <span className="text-xs font-mono text-pl-teal bg-pl-teal/10 px-2 py-1 rounded">LIVE DATA</span>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            <div className="text-center py-10">
                                <p className="text-gray-400 italic">In attesa di sincronizzazione...</p>
                                <p className="text-xs text-gray-500 mt-2">I dati verranno importati automaticamente.</p>
                            </div>
                            {/* TODO: Map fixtures here */}
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
