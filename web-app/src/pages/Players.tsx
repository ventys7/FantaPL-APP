import { useState, useMemo } from 'react';
import { Search, Users, Loader2, Sparkles, UserX, X, UserMinus } from 'lucide-react';
import { usePlayers, Player } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { matchesSearch } from '../lib/textUtils';
import { ROLES_WITH_ALL, ROLE_ORDER } from '../constants/players';
import { PlayerFilters, PlayerListHeader, PlayerDesktopRow, PlayerDesktopBlock, PlayerMobileCard, PlayerMobileBlock } from '../components/players';
import { EmptyState } from '../components/ui';

type SortKey = 'position' | 'quotation' | 'purchase_price' | null;
type SortDirection = 'asc' | 'desc';

// Use shared constants
const ROLES = ROLES_WITH_ALL;


export const Players = () => {
    const { players: rawPlayers, loading, error, refresh, teams, owners, realTeams } = usePlayers();
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('Tutti');
    const [teamFilter, setTeamFilter] = useState('Tutti');
    const [showNewOnly, setShowNewOnly] = useState(false);
    const [showInactiveOnly, setShowInactiveOnly] = useState(false); // New Inactive Filter
    const [showFreeAgentsOnly, setShowFreeAgentsOnly] = useState(false);

    // Sorting state - default to role ascending
    const [sortKey, setSortKey] = useState<SortKey>('position');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Cycle: desc -> asc -> reset to role
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else {
                // Was asc, reset to default (role asc)
                setSortKey('position');
                setSortDirection('asc');
            }
        } else {
            // New column: start with descending
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    // Expanded Blocks State
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

    const toggleBlock = (teamId: string) => {
        const newSet = new Set(expandedBlocks);
        if (newSet.has(teamId)) newSet.delete(teamId);
        else newSet.add(teamId);
        setExpandedBlocks(newSet);
    };

    // Filtered players
    const filteredPlayers = useMemo(() => {
        return rawPlayers.filter(player => {
            // "New" Filter (Takes Priority) - handled in processedList usually but let's see logic flow
            // Actually, keep logic here consistent.

            // Search filter (only player name, accent-insensitive)
            if (searchQuery && !matchesSearch(player.name, searchQuery)) {
                return false;
            }

            // Inactive Filter (Show ONLY inactive)
            if (showInactiveOnly) {
                if (player.is_active) return false;
            } else {
                // By default, assuming we only show ACTIVE players?
                // logic: if user wants to see inactive, they toggle it.
                // Existing code seemingly didn't filter inactive.
                // If we want to hide inactive by default:
                // if (!player.is_active) return false;
                // BUT current logic didn't filter them.
                // I will NOT hide them by default unless requested, to avoid breaking existing view.
                // BUT "Filtro per inattivi" implies separate view.
                // Let's stick to simple logic: Toggle ON -> Force !is_active
            }

            // Svincolati Filter
            if (showFreeAgentsOnly) {
                if (player.owner) return false; // Must have NO owner
            }

            // Role filter
            if (roleFilter !== 'Tutti' && player.position !== roleFilter) {
                return false;
            }
            // Team filter
            if (teamFilter !== 'Tutti' && player.team_short_name !== teamFilter) {
                return false;
            }

            return true;
        });
    }, [rawPlayers, searchQuery, roleFilter, teamFilter, showFreeAgentsOnly, showInactiveOnly]);

    // Sorted & Grouped Players (Blocks)
    const processedList = useMemo(() => {
        // "New" Filter: Show ONLY players from the last sync (detected by proximity to the latest created_at)
        if (showNewOnly && rawPlayers.length > 0) {
            const timestamps = rawPlayers.map(p => new Date(p.created_at).getTime());
            const latestTimestamp = Math.max(...timestamps);
            // Assume a sync takes at most 20 minutes. We show players created in that "last batch".
            const threshold = latestTimestamp - (20 * 60 * 1000); // 20 minutes

            const newPlayers = filteredPlayers.filter(p => new Date(p.created_at).getTime() > threshold);
            return newPlayers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        if (!sortKey) return filteredPlayers;

        // When sorting by price, exclude items with price 0
        let toSort = filteredPlayers;
        if (sortKey === 'purchase_price') {
            toSort = filteredPlayers.filter(p => {
                const price = p.position === 'Portiere'
                    ? (realTeams.find(t => t.$id === p.team_id)?.goalkeeper_purchase_price || 0)
                    : (p.purchase_price || 0);
                return price > 0;
            });
        }

        const sorted = [...toSort].sort((a, b) => {
            if (sortKey === 'position') {
                // Sort by role, then team, then quotation (desc), then name
                const roleA = ROLE_ORDER[a.position] || 5;
                const roleB = ROLE_ORDER[b.position] || 5;
                const roleDiff = sortDirection === 'asc' ? roleA - roleB : roleB - roleA;
                if (roleDiff !== 0) return roleDiff;

                // Same role: sort by team
                const teamDiff = a.team_short_name.localeCompare(b.team_short_name);
                if (teamDiff !== 0) return teamDiff;

                // Same team: sort by quotation descending
                const aQuot = a.position === 'Portiere' ? (realTeams.find(t => t.$id === a.team_id)?.goalkeeper_quotation || 0) : a.quotation;
                const bQuot = b.position === 'Portiere' ? (realTeams.find(t => t.$id === b.team_id)?.goalkeeper_quotation || 0) : b.quotation;

                const quotationDiff = (bQuot || 0) - (aQuot || 0);
                if (quotationDiff !== 0) return quotationDiff;

                return a.name.localeCompare(b.name);
            } else if (sortKey === 'quotation') {
                // For GKs, use block quotation from realTeams
                const aQuot = a.position === 'Portiere'
                    ? (realTeams.find(t => t.$id === a.team_id)?.goalkeeper_quotation || 0)
                    : (a.quotation || 0);
                const bQuot = b.position === 'Portiere'
                    ? (realTeams.find(t => t.$id === b.team_id)?.goalkeeper_quotation || 0)
                    : (b.quotation || 0);
                return sortDirection === 'asc' ? aQuot - bQuot : bQuot - aQuot;
            } else if (sortKey === 'purchase_price') {
                // For GKs, use block purchase_price from realTeams
                const aPrice = a.position === 'Portiere'
                    ? (realTeams.find(t => t.$id === a.team_id)?.goalkeeper_purchase_price || 0)
                    : (a.purchase_price || 0);
                const bPrice = b.position === 'Portiere'
                    ? (realTeams.find(t => t.$id === b.team_id)?.goalkeeper_purchase_price || 0)
                    : (b.purchase_price || 0);
                return sortDirection === 'asc' ? aPrice - bPrice : bPrice - aPrice;
            } else {
                // Numeric sort logic for other keys
                const aVal = a[sortKey] || 0;
                const bVal = b[sortKey] || 0;
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });

        // Group into Blocks for Goalkeepers
        const result: any[] = [];
        const seenTeams = new Set();

        sorted.forEach(p => {
            if (p.position === 'Portiere') {
                if (!seenTeams.has(p.team_id)) {
                    seenTeams.add(p.team_id);
                    const teamInfo = realTeams.find(t => t.$id === p.team_id);
                    // Create Block Item
                    const blockItem = {
                        isBlock: true,
                        id: `block-${p.team_id}`,
                        team_id: p.team_id,
                        team_name: p.team_name,
                        team_short_name: p.team_short_name,
                        position: 'Portiere',
                        quotation: teamInfo?.goalkeeper_quotation || 0,
                        purchase_price: teamInfo?.goalkeeper_purchase_price || 0,
                        owner: teamInfo?.goalkeeper_owner || null, // Block Owner!
                        players: sorted.filter(sp => sp.position === 'Portiere' && sp.team_id === p.team_id)
                    };
                    result.push(blockItem);
                }
            } else {
                result.push(p);
            }
        });

        return result;

    }, [filteredPlayers, sortKey, sortDirection, realTeams, showNewOnly]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pl-dark via-[#1a0a1f] to-pl-dark flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-pl-teal mx-auto mb-4" />
                    <p className="text-gray-400">Caricamento giocatori...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-pl-dark via-[#1a0a1f] to-pl-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={refresh} className="px-4 py-2 bg-pl-teal rounded-lg text-white">
                        Riprova
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-pl-dark via-[#1a0a1f] to-pl-dark">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Users className="text-pl-teal" />
                            Listone Giocatori
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {rawPlayers.length} giocatori in database
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md min-w-[200px] md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cerca giocatore..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pl-teal focus:ring-1 focus:ring-pl-teal"
                            />
                        </div>

                        {/* Nuovi Button */}
                        <button
                            onClick={() => setShowNewOnly(!showNewOnly)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition border whitespace-nowrap ${showNewOnly
                                ? 'bg-pl-teal text-pl-dark border-pl-teal'
                                : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                                }`}
                            title="Mostra solo nuovi giocatori"
                        >
                            <Sparkles size={20} />
                            <span className="hidden md:inline">Nuovi</span>
                        </button>

                        <button
                            onClick={() => setShowInactiveOnly(!showInactiveOnly)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition border whitespace-nowrap ${showInactiveOnly
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                                }`}
                            title="Mostra solo giocatori inattivi"
                        >
                            <UserMinus size={20} />
                            <span className="hidden md:inline">Inattivi</span>
                        </button>

                        {/* Svincolati Button */}
                        <button
                            onClick={() => setShowFreeAgentsOnly(!showFreeAgentsOnly)}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition border whitespace-nowrap ${showFreeAgentsOnly
                                ? 'bg-pl-teal text-pl-dark border-pl-teal'
                                : 'bg-white/10 text-gray-300 border-white/10 hover:bg-white/20'
                                }`}
                            title="Mostra solo giocatori svincolati"
                        >
                            <UserX size={20} />
                            <span className="hidden md:inline">Svincolati</span>
                        </button>

                        {/* Global Reset Button is handled inside PlayerFilters for mobile, but kept here for desktop if needed? 
                            The original code had a reset button here too (lines 298-315). 
                            Let's keep it for consistency or move it fully to Filters? 
                            The original had it separate. I'll keep it.
                        */}
                        {(searchQuery || showNewOnly || showInactiveOnly || showFreeAgentsOnly || roleFilter !== 'Tutti' || teamFilter !== 'Tutti') && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setShowNewOnly(false);
                                    setShowInactiveOnly(false);
                                    setShowFreeAgentsOnly(false);
                                    setRoleFilter('Tutti');
                                    setTeamFilter('Tutti');
                                    setSortKey('position');
                                }}
                                className="hidden md:flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold transition border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                title="Resetta Filtri"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <PlayerFilters
                    teams={teams}
                    currentRole={roleFilter}
                    onRoleChange={setRoleFilter}
                    currentTeam={teamFilter}
                    onTeamChange={setTeamFilter}
                    hasActiveFilters={!!(searchQuery || showNewOnly || showInactiveOnly || showFreeAgentsOnly || roleFilter !== 'Tutti' || teamFilter !== 'Tutti')}
                    onResetFilters={() => {
                        setSearchQuery('');
                        setShowNewOnly(false);
                        setShowInactiveOnly(false);
                        setShowFreeAgentsOnly(false);
                        setRoleFilter('Tutti');
                        setTeamFilter('Tutti');
                        setSortKey('position');
                    }}
                />

                {/* Players Table */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {/* Table Header */}
                    <PlayerListHeader
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                        onSort={handleSort}
                    />

                    {/* Player Rows - Desktop */}
                    <div className="hidden md:block divide-y divide-white/10">
                        {processedList.slice(0, (roleFilter !== 'Tutti' || showFreeAgentsOnly) ? undefined : 100).map(item => {
                            if (item.isBlock) {
                                return (
                                    <PlayerDesktopBlock
                                        key={item.id}
                                        item={item}
                                        isExpanded={expandedBlocks.has(item.team_id)}
                                        onToggle={() => toggleBlock(item.team_id)}
                                    />
                                );
                            } else {
                                return (
                                    <PlayerDesktopRow
                                        key={item.$id}
                                        player={item}
                                    />
                                );
                            }
                        })}
                    </div>

                    {/* Player Cards - Mobile */}
                    <div className="md:hidden divide-y divide-white/10">
                        {processedList.slice(0, (roleFilter !== 'Tutti' || showFreeAgentsOnly) ? undefined : 100).map(item => {
                            if (item.isBlock) {
                                return (
                                    <PlayerMobileBlock
                                        key={item.id}
                                        item={item}
                                        isExpanded={expandedBlocks.has(item.team_id)}
                                        onToggle={() => toggleBlock(item.team_id)}
                                    />
                                );
                            } else {
                                return (
                                    <PlayerMobileCard
                                        key={item.$id}
                                        player={item}
                                    />
                                );
                            }
                        })}
                    </div>

                    {/* Empty State: Using new shared component */}
                    {filteredPlayers.length === 0 && (
                        <EmptyState
                            title="Nessun giocatore trovato"
                            description="Prova a modificare i filtri di ricerca."
                            icon={Search}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
