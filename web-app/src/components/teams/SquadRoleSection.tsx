import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SquadRoleSectionProps {
    players: any[];
    role: string;
    label: string;
    required: number;
    countType?: 'player' | 'block';
    realTeams?: any[];
    managerName?: string; // Manager name to filter GK blocks
}

export const SquadRoleSection = ({
    players,
    role,
    label,
    required,
    countType = 'player',
    realTeams = [],
    managerName = ''
}: SquadRoleSectionProps) => {
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

    const toggleBlock = (teamId: string) => {
        setExpandedBlocks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(teamId)) newSet.delete(teamId);
            else newSet.add(teamId);
            return newSet;
        });
    };

    // Filter players by role
    const rolePlayers = players.filter(p => p.position === role);

    // For Goalkeepers: Group into blocks by team
    if (role === 'Portiere') {
        // Only show blocks where goalkeeper_owner matches this manager
        const ownedTeamIds = new Set(
            realTeams.filter(t => t.goalkeeper_owner === managerName).map(t => t.$id)
        );

        // Get all GKs that belong to owned blocks
        const allGks = players.filter(p => p.position === 'Portiere' && ownedTeamIds.has(p.team_id));

        // Get unique team IDs for GKs in owned blocks
        const teamIds = [...new Set(allGks.map(p => p.team_id))];

        // Create block data
        const blocks = teamIds.map(teamId => {
            const teamData = realTeams.find(t => t.$id === teamId);
            const teamPlayers = allGks.filter(p => p.team_id === teamId);
            return {
                teamId,
                teamName: teamPlayers[0]?.team_name || 'Team',
                teamShortName: teamPlayers[0]?.team_short_name || '???',
                quotation: teamData?.goalkeeper_quotation || 0,
                purchasePrice: teamData?.goalkeeper_purchase_price || 0,
                players: teamPlayers
            };
        });

        // Sort blocks by purchase price descending
        blocks.sort((a, b) => b.purchasePrice - a.purchasePrice);

        return (
            <div className="p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] uppercase font-bold text-gray-500">{label} (Blocchi)</span>
                </div>

                {blocks.length === 0 ? (
                    <div className="px-2 py-1 text-xs text-gray-600 italic">-</div>
                ) : (
                    <div className="space-y-1">
                        {blocks.map(block => (
                            <div key={block.teamId}>
                                {/* Block Header - Clickable */}
                                <div
                                    onClick={() => toggleBlock(block.teamId)}
                                    className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/5 transition group cursor-pointer"
                                >
                                    {/* Left: Team Logo & Photo Stack */}
                                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                        <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0" title={block.teamName}>
                                            <img
                                                src={`https://images.fotmob.com/image_resources/logo/teamlogo/${block.teamId.replace('team_', '')}.png`}
                                                alt={block.teamShortName}
                                                className="w-full h-full object-contain drop-shadow-md"
                                                loading="lazy"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    if (target.parentElement) {
                                                        target.parentElement.innerText = block.teamShortName?.substring(0, 3) || '?';
                                                        target.parentElement.className = "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0 bg-white/10 rounded-md text-[9px] font-bold text-gray-400";
                                                    }
                                                }}
                                            />
                                        </div>
                                        {/* Dynamic Grid for symmetry with player photo */}
                                        <div className="w-8 h-8 md:w-9 md:h-9 shrink-0 overflow-hidden rounded-full border border-white/20 bg-slate-800 shadow-lg pl-0">
                                            <div className={`grid w-full h-full p-[1px] gap-[1px] ${block.players.length === 2 ? 'grid-cols-2' :
                                                block.players.length >= 3 ? 'grid-cols-2 grid-rows-2' :
                                                    'grid-cols-1'
                                                }`}>
                                                {block.players.length === 1 ? (
                                                    <div className="w-full h-full overflow-hidden">
                                                        <img src={block.players[0].image_url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : block.players.length === 2 ? (
                                                    block.players.map(p => (
                                                        <div key={p.$id} className="w-full h-full overflow-hidden">
                                                            <img src={p.image_url} alt="" className="w-full h-full object-cover scale-[1.1]" />
                                                        </div>
                                                    ))
                                                ) : block.players.length === 3 ? (
                                                    block.players.map(p => (
                                                        <div key={p.$id} className="w-full h-full overflow-hidden">
                                                            <img src={p.image_url} alt="" className="w-full h-full object-cover scale-[1.2]" />
                                                        </div>
                                                    ))
                                                ) : (
                                                    // 4 or more players
                                                    block.players.slice(0, 4).map((p, idx) => (
                                                        <div key={p.$id} className="w-full h-full overflow-hidden relative">
                                                            <img src={p.image_url} alt="" className="w-full h-full object-cover scale-[1.2]" />
                                                            {idx === 3 && block.players.length > 4 && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[8px] font-bold text-white">
                                                                    +{block.players.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm md:text-base text-gray-200 truncate group-hover:text-white transition font-medium">
                                                Blocco {block.teamShortName}
                                            </span>
                                            <ChevronDown size={14} className={`text-gray-500 transition shrink-0 ${expandedBlocks.has(block.teamId) ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Right: Quotation, Price */}
                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                        <div className="flex flex-col items-end leading-none">
                                            <span className="text-[8px] md:text-[10px] text-gray-500 mb-0.5">Q</span>
                                            <span className="text-xs md:text-base font-bold text-white">{block.quotation}</span>
                                        </div>
                                        <div className="flex flex-col items-end leading-none w-8">
                                            <span className="text-[8px] md:text-[10px] text-gray-500 mb-0.5">P</span>
                                            <span className="text-xs md:text-base font-bold text-pl-teal">{block.purchasePrice || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded: List of GKs */}
                                {expandedBlocks.has(block.teamId) && (
                                    <div className="ml-6 pl-3 border-l border-white/10 space-y-1 py-1">
                                        {block.players.map(p => (
                                            <div key={p.$id} className="flex items-center gap-2 py-1 text-xs text-gray-400">
                                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden border border-white/20 shrink-0">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">?</div>
                                                    )}
                                                </div>
                                                <span className={`truncate ${p.is_active === false ? 'italic text-gray-500' : ''}`}>
                                                    {p.name}{p.is_active === false ? '*' : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Non-GK players: Standard list
    // Sort by Price Desc
    rolePlayers.sort((a, b) => (b.purchase_price || 0) - (a.purchase_price || 0));

    return (
        <div className="p-3">
            <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] uppercase font-bold text-gray-500">{label}</span>
                <span className={`text-[10px] font-mono ${rolePlayers.length === (countType === 'block' ? 99 : required) ? 'text-green-400' : 'text-gray-600'}`}>
                    {/* Optional count display */}
                </span>
            </div>

            {rolePlayers.length === 0 ? (
                <div className="px-2 py-1 text-xs text-gray-600 italic">-</div>
            ) : (
                <div className="space-y-1">
                    {rolePlayers.map(p => (
                        <div key={p.$id} className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/5 transition group">
                            {/* Left: Team Logo, Player Photo, Name */}
                            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0" title={p.team_name}>
                                    <img
                                        src={`https://images.fotmob.com/image_resources/logo/teamlogo/${p.team_id.replace('team_', '')}.png`}
                                        alt={p.team_short_name}
                                        className="w-full h-full object-contain drop-shadow-md"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            if (target.parentElement) {
                                                target.parentElement.innerText = p.team_short_name?.substring(0, 3) || '?';
                                                target.parentElement.className = "w-8 h-8 md:w-9 md:h-9 flex items-center justify-center shrink-0 bg-white/10 rounded-md text-[9px] font-bold text-gray-400";
                                            }
                                        }}
                                    />
                                </div>
                                {/* Player Photo wrapper - Match the padding/alignment of GK grid */}
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-800 border border-white/20 overflow-hidden shrink-0 shadow-lg">
                                    {p.image_url ? (
                                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">?</div>
                                    )}
                                </div>
                                <span className={`text-sm md:text-base text-gray-200 truncate group-hover:text-white transition font-medium ${p.is_active === false ? 'italic !text-gray-500' : ''}`}>
                                    {p.name}{p.is_active === false ? '*' : ''}
                                </span>
                            </div>

                            {/* Right: Quotation, Price - Scaled */}
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                <div className="flex flex-col items-end leading-none">
                                    <span className="text-[8px] md:text-[10px] text-gray-500 mb-0.5">Q</span>
                                    <span className="text-xs md:text-base font-bold text-white">
                                        {p.quotation}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end leading-none w-8">
                                    <span className="text-[8px] md:text-[10px] text-gray-500 mb-0.5">P</span>
                                    <span className="text-xs md:text-base font-bold text-pl-teal">
                                        {p.purchase_price || '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
