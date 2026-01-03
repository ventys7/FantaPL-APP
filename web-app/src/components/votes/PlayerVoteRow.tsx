import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import { PlayerPerformance } from '../../services/votingService';

interface Player {
    id: string;
    name: string;
    role: string;
}

interface PlayerVoteRowProps {
    player: Player;
    performance: PlayerPerformance;
    onValueChange: (id: string, field: keyof PlayerPerformance, value: any) => void;
    onIncrement: (id: string, field: keyof PlayerPerformance) => void;
    onDecrement: (id: string, field: keyof PlayerPerformance) => void;
    totalScore: number;
}

export const PlayerVoteRow = ({
    player,
    performance,
    onValueChange,
    onIncrement,
    onDecrement,
    totalScore
}: PlayerVoteRowProps) => {
    return (
        <div className="grid grid-cols-12 gap-2 items-center bg-pl-dark/40 border-b border-gray-700 p-2 hover:bg-gray-800/50 transition-colors">
            {/* Name & Role */}
            <div className="col-span-3 flex items-center space-x-2">
                <span className={clsx(
                    "text-xs font-bold px-1.5 py-0.5 rounded",
                    {
                        'bg-yellow-500/20 text-yellow-500': player.role === 'GK',
                        'bg-blue-500/20 text-blue-500': player.role === 'DEF',
                        'bg-green-500/20 text-green-500': player.role === 'MID',
                        'bg-red-500/20 text-red-500': player.role === 'ATT'
                    }
                )}>{player.role}</span>
                <span className="text-sm font-medium text-white truncate" title={player.name}>{player.name}</span>
            </div>

            {/* Base Vote */}
            <div className="col-span-1">
                <input
                    type="number" step="0.5" min="1" max="10"
                    className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-center text-white font-bold focus:border-pl-blue outline-none"
                    placeholder="-"
                    value={performance.vote_base || ''}
                    onChange={(e) => onValueChange(player.id, 'vote_base', parseFloat(e.target.value))}
                />
            </div>

            {/* Bonuses (Counters) */}
            <div className="col-span-6 flex items-center space-x-3 text-xs">
                {/* Goals */}
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 mb-1">GOL</span>
                    <div className="flex items-center space-x-1">
                        <button tabIndex={-1} onClick={() => onDecrement(player.id, 'goals_scored')} className="hover:text-red-400"><Minus size={14} /></button>
                        <span className={clsx("font-bold w-4 text-center", (performance.goals_scored || 0) > 0 ? "text-pl-green" : "text-gray-600")}>{performance.goals_scored || 0}</span>
                        <button tabIndex={-1} onClick={() => onIncrement(player.id, 'goals_scored')} className="hover:text-green-400"><Plus size={14} /></button>
                    </div>
                </div>

                {/* Assists */}
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 mb-1">AST</span>
                    <div className="flex items-center space-x-1">
                        <button tabIndex={-1} onClick={() => onDecrement(player.id, 'assists')} className="hover:text-red-400"><Minus size={14} /></button>
                        <span className={clsx("font-bold w-4 text-center", (performance.assists || 0) > 0 ? "text-pl-blue" : "text-gray-600")}>{performance.assists || 0}</span>
                        <button tabIndex={-1} onClick={() => onIncrement(player.id, 'assists')} className="hover:text-green-400"><Plus size={14} /></button>
                    </div>
                </div>

                {/* Cards */}
                <div className="flex flex-col items-center">
                    <span className="text-gray-500 mb-1">AM/ES</span>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => onValueChange(player.id, 'yellow_cards', performance.yellow_cards ? 0 : 1)}
                            className={clsx("w-5 h-6 rounded flex items-center justify-center border", performance.yellow_cards ? "bg-yellow-500 border-yellow-600 text-black" : "bg-transparent border-gray-600")}
                        >Y</button>
                        <button
                            onClick={() => onValueChange(player.id, 'red_cards', performance.red_cards ? 0 : 1)}
                            className={clsx("w-5 h-6 rounded flex items-center justify-center border", performance.red_cards ? "bg-red-500 border-red-600 text-white" : "bg-transparent border-gray-600")}
                        >R</button>
                    </div>
                </div>

                {/* Clean Sheet */}
                {(player.role === 'GK' || player.role === 'DEF') && (
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 mb-1">CS</span>
                        <input
                            type="checkbox"
                            checked={performance.clean_sheet || false}
                            onChange={(e) => onValueChange(player.id, 'clean_sheet', e.target.checked)}
                            className="w-4 h-4 accent-pl-green"
                        />
                    </div>
                )}
            </div>

            {/* Total Score Preview */}
            <div className="col-span-2 text-right">
                <div className="text-xxs text-gray-500 uppercase tracking-wider">TOT</div>
                <div className={clsx("text-xl font-black", totalScore >= 6 ? "text-pl-green" : "text-gray-400")}>
                    {totalScore.toFixed(1)}
                </div>
            </div>
        </div>
    );
};
