import { Trophy } from 'lucide-react';

interface LiveScoreCardProps {
    myScore: number;
    opponentScore: number;
}

export const LiveScoreCard = ({ myScore, opponentScore }: LiveScoreCardProps) => {
    return (
        <div className="group relative bg-gradient-to-br from-pl-purple/40 to-pl-pink/20 backdrop-blur-xl p-6 rounded-2xl border border-pl-pink/30 shadow-2xl hover:scale-105 transition-all duration-500 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pl-pink/20 to-pl-teal/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
                <div className="text-gray-300 text-xs font-bold uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4 text-pl-pink" />
                    Live Score
                </div>
                <div className="flex items-center justify-center space-x-6">
                    <div className="transform group-hover:scale-110 transition-transform duration-500">
                        <div className="text-5xl font-black bg-gradient-to-b from-white to-pl-teal bg-clip-text text-transparent drop-shadow-lg">
                            {myScore}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-medium">You</div>
                    </div>
                    <div className="text-2xl text-gray-600 font-bold">VS</div>
                    <div className="transform group-hover:scale-110 transition-transform duration-500">
                        <div className="text-5xl font-black text-gray-500">
                            {opponentScore}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 font-medium">Opp</div>
                    </div>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1.5 rounded-full border border-green-500/30 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    MATCH IN PROGRESS
                </div>
            </div>
        </div>
    );
};
