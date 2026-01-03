import { TrendingUp, Zap } from 'lucide-react';

interface NextOpponentCardProps {
    opponentName: string;
}

export const NextOpponentCard = ({ opponentName }: NextOpponentCardProps) => {
    return (
        <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl hover:shadow-pl-teal/20 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pl-teal/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={80} className="text-pl-pink" />
            </div>
            <div className="relative">
                <h2 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Next Opponent</h2>
                <div className="text-xl font-bold text-white mb-1">{opponentName}</div>
                <div className="text-gray-400 text-sm flex items-center gap-2">
                    <Zap className="w-3 h-3 text-pl-pink" />
                    GW 4 - Anfield
                </div>
            </div>
        </div>
    );
};
