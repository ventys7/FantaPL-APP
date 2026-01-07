import { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { databases, DB_ID, COLL_FANTASY_TEAMS } from '../lib/appwrite'; // Import DB constants
import { Loader2, Users, Shield, Coins, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { UserRole } from '../types/shared';

// Helper to normalize owner names (handling slight variations if needed)
const normalizeOwner = (name: string) => name?.trim() || 'Svincolato';

type TeamSquad = {
    managerName: string;
    teamName: string;
    logoUrl?: string; // Avatar
    budget: number;
    spent: number;
    remaining: number;
    players: any[];
    isComplete: boolean;
    roleCounts: { P: number; D: number; C: number; A: number };
    totalPlayers: number;
    teamId: string;
};

const REQUIRED_COUNTS = { P: 2, D: 8, C: 8, A: 6 };

export const TeamsList = () => {
    const { players, loading: playersLoading, error, realTeams } = usePlayers();
    const { user } = useAuth();
    const [teamsAnalysis, setTeamsAnalysis] = useState<TeamSquad[]>([]);
    const [fantasyTeams, setFantasyTeams] = useState<any[]>([]); // State for Fantasy Teams
    const [loadingTeams, setLoadingTeams] = useState(true);

    // Fetch Fantasy Teams
    useEffect(() => {
        const fetchFantasyTeams = async () => {
            try {
                const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS);
                setFantasyTeams(response.documents);
            } catch (err) {
                console.error("Error fetching fantasy teams:", err);
            } finally {
                setLoadingTeams(false);
            }
        };
        fetchFantasyTeams();
    }, []);

    // Process Players and Owners into Squads
    useEffect(() => {
        if (!players.length || !fantasyTeams.length) return;

        // 1. Get List of Managers (excluding "Svincolato" and potentially Ghost Admin if handled in usePlayers)
        // owners array from usePlayers usually contains names. But we need metadata (Team Name, Logo) if available.
        // usePlayers hook returns `owners` as string[]. We might need access to `teams` (Collection Documents) for metadata.
        // The `teams` export from `usePlayers` likely contains the raw team documents.

        // Assuming `teams` from usePlayers hook contains the fantasy_teams documents
        // If not, we might need to fetch them directly or reuse what's available.
        // Let's assume `teams` has the data structure: { $id, manager_name, team_name, logo_url, credits_remaining, hidden, role }

        // Filter valid teams
        const activeTeams = fantasyTeams.filter((t: any) => !t.hidden && t.manager_name !== 'Admin'); // Exclude Admin & Hidden

        const analysis = activeTeams.map((team: any) => {
            const managerName = team.manager_name || 'N/A';
            const teamId = team.$id;

            // Find players owned by this manager
            // Note: DB player.owner stores the MANAGER NAME currently
            const squadPlayers = players.filter(p => p.owner === managerName);

            // Group by Role for Counts
            const roleCounts = { P: 0, D: 0, C: 0, A: 0 };

            // Handle Blocks for Goalkeepers!
            // If a manager owns a GK Block, it counts as "Players"? 
            // In the "Squad List" spec: "2 blocchi portiere, 8 difensori, 8 centrocampisti, 6 attaccanti"
            // Wait, "2 blocchi portiere" - usually means 2 TEAMS (e.g. Inter + Milan).
            // But individual players are stored.
            // Logic: Count Unique GK Blocks? Or Count individual GKs?
            // "rosa intera che è formata cosi: 2 blocchi portiere..."
            // Usually FantaPL logic: You buy the BLOCK.
            // So for P, we count unique `team_id` among owned GKs?
            // Or simpler: Just grouping players.
            // Let's verify: "2 blocchi portiere".
            // So I should count unique Real Teams for GKs.

            const gkTeams = new Set<string>();
            let spent = 0;

            squadPlayers.forEach(p => {
                spent += (p.purchase_price || 0);

                if (p.position === 'Portiere') {
                    // Logic: Each real team counts as 1 block.
                    // But wait, owner owns specific players? Or the block?
                    // Previous tasks: "Update sync_players to enforce GK ownership from Team".
                    // So if owner owns "Sommer", he owns "Inter Block".
                    // Efficient way: Count unique team_ids for Portieri.
                    gkTeams.add(p.team_id);
                } else if (p.position === 'Difensore') roleCounts.D++;
                else if (p.position === 'Centrocampista') roleCounts.C++;
                else if (p.position === 'Attaccante') roleCounts.A++;
            });

            roleCounts.P = gkTeams.size;

            const totalPlayers = roleCounts.P + roleCounts.D + roleCounts.C + roleCounts.A;
            // Complete Check: 2 P (Blocks), 8 D, 8 C, 6 A
            const isComplete =
                roleCounts.P === 2 &&
                roleCounts.D === 8 &&
                roleCounts.C === 8 &&
                roleCounts.A === 6;

            const remaining = team.credits ?? 500;

            return {
                managerName,
                teamName: team.team_name || `Squadra di ${managerName}`,
                logoUrl: team.fantasylogo_url, // Fantasy team logo
                budget: team.budget || 500,
                spent,
                remaining,
                players: squadPlayers, // Raw list, we'll group in render
                activePlayersCount: squadPlayers.length,
                roleCounts,
                isComplete,
                totalPlayers,
                teamId
            };
        });

        // Sort alphabetically by Manager Name
        analysis.sort((a, b) => a.managerName.localeCompare(b.managerName));

        setTeamsAnalysis(analysis);

    }, [players, fantasyTeams]); // teams from usePlayers

    if (playersLoading || loadingTeams) return (
        <div className="min-h-screen bg-gradient-to-b from-pl-dark via-[#1a0a1f] to-pl-dark flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-pl-teal" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-pl-dark via-[#1a0a1f] to-pl-dark pb-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
                        <Users className="text-pl-teal" />
                        Lista Rose
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Panoramica delle rose, budget residui e completamento squadre.
                    </p>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {teamsAnalysis.map((team, idx) => (
                        <TeamCard key={idx} team={team} realTeams={realTeams} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Extracted TeamCard Component with Local State
const TeamCard = ({ team, realTeams }: { team: TeamSquad, realTeams: any[] }) => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'P' | 'D' | 'C' | 'A'>('ALL');

    const toggleFilter = (role: 'P' | 'D' | 'C' | 'A') => {
        setActiveFilter(prev => prev === role ? 'ALL' : role);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group">
            {/* Card Header */}
            <div className="p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/5">
                <div className="flex items-center gap-4 mb-4">
                    {/* Logo/Avatar */}
                    <div className="w-16 h-16 rounded-full bg-pl-teal/10 border-2 border-pl-teal/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-pl-teal">{team.managerName.charAt(0)}</span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-white truncate" title={team.teamName}>{team.teamName}</h3>
                        <div className="text-sm text-gray-400 font-medium">Allenatore: <span className="text-gray-200">{team.managerName}</span></div>
                    </div>
                </div>

                {/* Budget & Status Row */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Budget</span>
                        <div className="flex items-center gap-1.5 text-pl-teal font-mono font-bold text-lg">
                            <Coins size={16} />
                            {team.remaining} <span className="text-xs text-gray-500 font-normal self-end mb-0.5">/ {team.budget}</span>
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${team.isComplete
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        {team.isComplete ? <Shield size={12} /> : <AlertCircle size={12} />}
                        {team.isComplete ? 'ROSA COMPLETA' : 'INCOMPLETA'}
                    </div>
                </div>
            </div>

            {/* Squad Breakdown (Clickable Filters) */}
            <div className="p-4 bg-black/20 text-xs text-gray-400 grid grid-cols-4 gap-2 text-center border-b border-white/5">
                <button
                    onClick={() => toggleFilter('P')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'P' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.P === 2 ? 'text-green-400 font-bold' : ''}`}
                >
                    P: {team.roleCounts.P}/2
                </button>
                <button
                    onClick={() => toggleFilter('D')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'D' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.D === 8 ? 'text-green-400 font-bold' : ''}`}
                >
                    D: {team.roleCounts.D}/8
                </button>
                <button
                    onClick={() => toggleFilter('C')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'C' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.C === 8 ? 'text-green-400 font-bold' : ''}`}
                >
                    C: {team.roleCounts.C}/8
                </button>
                <button
                    onClick={() => toggleFilter('A')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'A' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.A === 6 ? 'text-green-400 font-bold' : ''}`}
                >
                    A: {team.roleCounts.A}/6
                </button>
            </div>

            {/* Detailed Roster */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5 bg-black/10 transition-all">
                {/* Conditionally Render Sections based on activeFilter */}
                {(activeFilter === 'ALL' || activeFilter === 'P') && (
                    <SquadRoleSection players={team.players} role="Portiere" label="Portieri" required={2} countType="block" realTeams={realTeams} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'D') && (
                    <SquadRoleSection players={team.players} role="Difensore" label="Difensori" required={8} realTeams={realTeams} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'C') && (
                    <SquadRoleSection players={team.players} role="Centrocampista" label="Centrocampisti" required={8} realTeams={realTeams} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'A') && (
                    <SquadRoleSection players={team.players} role="Attaccante" label="Attaccanti" required={6} realTeams={realTeams} />
                )}
            </div>
        </div>
    );
};
const SquadRoleSection = ({ players, role, label, required, countType = 'player', realTeams = [] }: { players: any[], role: string, label: string, required: number, countType?: 'player' | 'block', realTeams?: any[] }) => {
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
        // Get unique team IDs for GKs owned by this manager
        const teamIds = [...new Set(rolePlayers.map(p => p.team_id))];

        // Create block data
        const blocks = teamIds.map(teamId => {
            const teamData = realTeams.find(t => t.$id === teamId);
            const teamPlayers = rolePlayers.filter(p => p.team_id === teamId);
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
                                                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))
                                                ) : block.players.length === 3 ? (
                                                    <>
                                                        <div className="col-span-2 w-full h-full overflow-hidden">
                                                            <img src={block.players[0].image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="w-full h-full overflow-hidden">
                                                            <img src={block.players[1].image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="w-full h-full overflow-hidden">
                                                            <img src={block.players[2].image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    // 4 or more players
                                                    block.players.slice(0, 4).map((p, idx) => (
                                                        <div key={p.$id} className="w-full h-full overflow-hidden relative">
                                                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
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
                                                Blocco {block.teamName}
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
                                                <span className="truncate">{p.name}</span>
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
                                <span className="text-sm md:text-base text-gray-200 truncate group-hover:text-white transition font-medium">{p.name}</span>
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
