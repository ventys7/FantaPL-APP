import { Calendar, Trophy } from 'lucide-react';

export function Fixtures() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Calendar className="w-8 h-8 text-pl-pink" />
                    <h1 className="text-4xl font-bold text-white">Fixtures</h1>
                </div>

                {/* Premier League Fixtures */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-6 h-6 text-pl-teal" />
                        <h2 className="text-2xl font-bold text-white">Premier League</h2>
                    </div>
                    <p className="text-gray-300 text-center py-8">
                        Nessuna partita programmata
                    </p>
                </div>

                {/* Fantasy Fixtures */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-6 h-6 text-pl-pink" />
                        <h2 className="text-2xl font-bold text-white">FantaPL Matches</h2>
                    </div>
                    <p className="text-gray-300 text-center py-8">
                        Nessuna sfida in programma
                    </p>
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
