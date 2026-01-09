import { Coins } from 'lucide-react';
import { SelectableTeamCard } from './SelectableTeamCard';

interface TradeTeamPanelProps {
    title: string;
    subtitle: string;
    credits: number;
    showCredits?: boolean;
    players: any[];
    realTeams: any[];
    selectedPlayers: Set<string>;
    selectedBlocks: Set<string>;
    onTogglePlayer: (id: string) => void;
    onToggleBlock: (id: string, gkIds: string[]) => void;
    ownerName: string;
    children?: React.ReactNode; // For extra header elements like the dropdown
    emptyMessage?: string;
    isActive: boolean; // Mobile tab logic
}

export const TradeTeamPanel = ({
    title, subtitle, credits, showCredits = true,
    players, realTeams, selectedPlayers, selectedBlocks,
    onTogglePlayer, onToggleBlock, ownerName,
    children, emptyMessage, isActive
}: TradeTeamPanelProps) => {
    return (
        <div className={`flex-1 flex-col overflow-hidden ${isActive ? 'flex' : 'hidden md:flex'} ${title === 'La Mia Rosa' ? 'border-r border-white/10' : ''}`}>
            {/* Header */}
            <div className={`px-4 py-3 border-b border-white/5 flex-shrink-0 flex items-center justify-between ${title === 'La Mia Rosa' ? 'bg-pl-teal/10' : 'bg-black/20'}`}>
                <div>
                    <div className="flex items-center gap-2">
                        {children ? children : <h3 className="font-bold text-white">{title}</h3>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
                </div>
                {showCredits && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
                        <Coins size={14} className="text-pl-teal" />
                        <span className="text-sm font-mono font-bold text-pl-teal">{credits}</span>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {players.length > 0 || (emptyMessage === undefined) ? (
                    <SelectableTeamCard
                        players={players}
                        realTeams={realTeams}
                        ownerName={ownerName}
                        selectedPlayers={selectedPlayers}
                        selectedBlocks={selectedBlocks}
                        onTogglePlayer={onTogglePlayer}
                        onToggleBlock={onToggleBlock}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm italic px-10 text-center">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
};
