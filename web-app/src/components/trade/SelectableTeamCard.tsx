import { useState, useMemo } from 'react';
import { Shield, Check } from 'lucide-react';
import { ROLE_COLORS, ROLE_ABBR, ROLE_ORDER } from '../../constants/players';

interface Player {
    $id: string;
    name: string;
    position: string;
    team_short_name: string;
    team_id: string;
    quotation: number;
    purchase_price: number;
    image_url?: string;
}

interface SelectableTeamCardProps {
    players: Player[];
    realTeams: any[];
    ownerName: string; // Manager name to filter GK blocks
    selectedPlayers: Set<string>;
    selectedBlocks: Set<string>;
    onTogglePlayer: (playerId: string) => void;
    onToggleBlock: (blockId: string, gkIds: string[]) => void;
    disabled?: boolean;
}

export const SelectableTeamCard = ({
    players,
    realTeams,
    ownerName,
    selectedPlayers,
    selectedBlocks,
    onTogglePlayer,
    onToggleBlock,
    disabled = false
}: SelectableTeamCardProps) => {

    // Group players by role
    const groupedPlayers = useMemo(() => {
        const groups: Record<string, Player[]> = {
            Portiere: [],
            Difensore: [],
            Centrocampista: [],
            Attaccante: []
        };

        players.forEach(p => {
            if (groups[p.position]) {
                groups[p.position].push(p);
            }
        });

        // Sort each group by quotation desc
        Object.keys(groups).forEach(role => {
            groups[role].sort((a, b) => (b.quotation || 0) - (a.quotation || 0));
        });

        return groups;
    }, [players]);

    // Group GKs by team (blocks) - only show blocks owned by this manager
    const gkBlocks = useMemo(() => {
        const blocks: Map<string, { teamId: string; teamName: string; gks: Player[]; quotation: number }> = new Map();

        // Only include real_teams where goalkeeper_owner matches ownerName
        const ownedTeamIds = new Set(
            realTeams.filter(t => t.goalkeeper_owner === ownerName).map(t => t.$id)
        );

        // Get all GKs from owned blocks
        const allPlayers = players; // players already filtered by owner
        const gks = allPlayers.filter(p => p.position === 'Portiere' && ownedTeamIds.has(p.team_id));

        gks.forEach(gk => {
            if (!blocks.has(gk.team_id)) {
                const teamInfo = realTeams.find(t => t.$id === gk.team_id);
                blocks.set(gk.team_id, {
                    teamId: gk.team_id,
                    teamName: gk.team_short_name,
                    gks: [],
                    quotation: teamInfo?.goalkeeper_quotation || 0
                });
            }
            blocks.get(gk.team_id)!.gks.push(gk);
        });

        return Array.from(blocks.values());
    }, [players, realTeams, ownerName]);

    const renderPlayerRow = (player: Player, isGk: boolean = false) => {
        const isSelected = selectedPlayers.has(player.$id);

        return (
            <div
                key={player.$id}
                onClick={() => !disabled && !isGk && onTogglePlayer(player.$id)}
                className={`flex items-center gap-3 px-3 py-2 transition cursor-pointer border-b border-white/5 last:border-b-0
                    ${isSelected ? 'bg-pl-teal/20 border-pl-teal/30' : 'hover:bg-white/5'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isGk ? 'pl-8 opacity-70' : ''}
                `}
            >
                {/* Selection indicator */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                    ${isSelected ? 'bg-pl-teal border-pl-teal' : 'border-white/30'}
                `}>
                    {isSelected && <Check size={12} className="text-pl-dark" />}
                </div>

                {/* Player image */}
                <img
                    src={player.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3d195b&color=fff`}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover bg-white/10"
                />

                {/* Role badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[player.position] || ROLE_COLORS['Unknown']}`}>
                    {ROLE_ABBR[player.position] || '?'}
                </span>

                {/* Name */}
                <span className="flex-1 text-sm text-white truncate">{player.name}</span>

                {/* Team */}
                <span className="text-xs text-gray-500">{player.team_short_name}</span>

                {/* Quotation */}
                <span className="text-sm font-mono text-gray-400 w-8 text-right">{player.quotation}</span>
            </div>
        );
    };

    const renderBlockRow = (block: { teamId: string; teamName: string; gks: Player[]; quotation: number }) => {
        const isSelected = selectedBlocks.has(block.teamId);
        const gkIds = block.gks.map(gk => gk.$id);
        const fotmobId = block.teamId.replace('team_', '');
        const teamLogoUrl = `https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png`;

        return (
            <div key={block.teamId} className="border-b border-white/5 last:border-b-0">
                <div
                    onClick={() => !disabled && onToggleBlock(block.teamId, gkIds)}
                    className={`flex items-center gap-3 px-3 py-2 transition cursor-pointer
                        ${isSelected ? 'bg-pl-teal/20' : 'hover:bg-white/5'}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {/* Selection indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                        ${isSelected ? 'bg-pl-teal border-pl-teal' : 'border-white/30'}
                    `}>
                        {isSelected && <Check size={12} className="text-pl-dark" />}
                    </div>

                    {/* Team logo */}
                    <img
                        src={teamLogoUrl}
                        alt={block.teamName}
                        className="w-8 h-8 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=?'; }}
                    />

                    {/* Role badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS['Portiere']}`}>
                        P
                    </span>

                    {/* Block name */}
                    <span className="flex-1 text-sm text-white">Blocco {block.teamName}</span>

                    {/* Shield icon */}
                    <Shield size={14} className="text-yellow-500" />

                    {/* Quotation */}
                    <span className="text-sm font-mono text-gray-400 w-8 text-right">{block.quotation}</span>
                </div>

                {/* Show individual GKs when block is selected */}
                {isSelected && (
                    <div className="bg-black/20 border-t border-white/5">
                        {block.gks.map(gk => (
                            <div key={gk.$id} className="flex items-center gap-3 px-3 py-1.5 pl-12 text-xs text-gray-400">
                                <img
                                    src={gk.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(gk.name)}&background=3d195b&color=fff`}
                                    alt={gk.name}
                                    className="w-6 h-6 rounded-full object-cover bg-white/10"
                                />
                                <span className="flex-1">{gk.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {/* GK Blocks */}
            {gkBlocks.length > 0 && (
                <div className="border-b border-white/10">
                    <div className="px-3 py-2 bg-black/20 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Portieri (Blocchi)
                    </div>
                    {gkBlocks.map(block => renderBlockRow(block))}
                </div>
            )}

            {/* Defenders */}
            {groupedPlayers.Difensore.length > 0 && (
                <div className="border-b border-white/10">
                    <div className="px-3 py-2 bg-black/20 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Difensori ({groupedPlayers.Difensore.length})
                    </div>
                    {groupedPlayers.Difensore.map(p => renderPlayerRow(p))}
                </div>
            )}

            {/* Midfielders */}
            {groupedPlayers.Centrocampista.length > 0 && (
                <div className="border-b border-white/10">
                    <div className="px-3 py-2 bg-black/20 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Centrocampisti ({groupedPlayers.Centrocampista.length})
                    </div>
                    {groupedPlayers.Centrocampista.map(p => renderPlayerRow(p))}
                </div>
            )}

            {/* Attackers */}
            {groupedPlayers.Attaccante.length > 0 && (
                <div>
                    <div className="px-3 py-2 bg-black/20 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Attaccanti ({groupedPlayers.Attaccante.length})
                    </div>
                    {groupedPlayers.Attaccante.map(p => renderPlayerRow(p))}
                </div>
            )}

            {/* Empty state */}
            {players.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                    Nessun giocatore in rosa
                </div>
            )}
        </div>
    );
};
