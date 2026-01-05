import { useState, useMemo } from 'react';
import { Search, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';

type SortKey = 'position' | 'quotation' | 'purchase_price' | null;
type SortDirection = 'asc' | 'desc';

const ROLES = ['Tutti', 'Portiere', 'Difensore', 'Centrocampista', 'Attaccante'];
const ROLE_COLORS: Record<string, string> = {
    'Portiere': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Difensore': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Centrocampista': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Attaccante': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Unknown': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const ROLE_ABBREV: Record<string, string> = {
    'Portiere': 'P',
    'Difensore': 'D',
    'Centrocampista': 'C',
    'Attaccante': 'A',
    'Unknown': '?',
};

// Role order for sorting: P < D < C < A
const ROLE_ORDER: Record<string, number> = {
    'Portiere': 1,
    'Difensore': 2,
    'Centrocampista': 3,
    'Attaccante': 4,
    'Unknown': 5,
};

export const Players = () => {
    const { players, loading, error, refresh, teams, owners } = usePlayers();
    const { user } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('Tutti');
    const [teamFilter, setTeamFilter] = useState('Tutti');
    const [ownerFilter, setOwnerFilter] = useState('Tutti');
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    // Sorting state - default to role ascending
    const [sortKey, setSortKey] = useState<SortKey>('position');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            // Toggle direction (no clear for role)
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Filtered players
    const filteredPlayers = useMemo(() => {
        return players.filter(player => {
            // Search filter (only player name)
            if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            // Role filter
            if (roleFilter !== 'Tutti' && player.position !== roleFilter) {
                return false;
            }
            // Team filter
            if (teamFilter !== 'Tutti' && player.team_short_name !== teamFilter) {
                return false;
            }
            // Owner filter
            const playerOwner = player.owner || 'Svincolato';
            if (ownerFilter !== 'Tutti' && playerOwner !== ownerFilter) {
                return false;
            }
            return true;
        });
    }, [players, searchQuery, roleFilter, teamFilter, ownerFilter]);

    // Sorted players
    const sortedPlayers = useMemo(() => {
        if (!sortKey) return filteredPlayers;

        return [...filteredPlayers].sort((a, b) => {
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
                const quotationDiff = (b.quotation || 0) - (a.quotation || 0);
                if (quotationDiff !== 0) return quotationDiff;

                // Same quotation: sort by name
                return a.name.localeCompare(b.name);
            } else {
                // Numeric sort for quotation/purchase_price
                const aVal = a[sortKey] || 0;
                const bVal = b[sortKey] || 0;
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });
    }, [filteredPlayers, sortKey, sortDirection]);

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
                            {filteredPlayers.length} di {players.length} giocatori
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cerca giocatore..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pl-teal focus:ring-1 focus:ring-pl-teal"
                            />
                        </div>

                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6">
                    {/* Desktop: All filters in one row */}
                    <div className="hidden md:flex items-center justify-between">
                        {/* Role Pills - Left */}
                        <div className="flex gap-2 flex-wrap">
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${roleFilter === role
                                        ? 'bg-pl-teal text-pl-dark'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                        }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>

                        {/* Dropdowns - Right */}
                        <div className="flex gap-2">

                            {/* Team Dropdown - Desktop */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowTeamDropdown(!showTeamDropdown); setShowOwnerDropdown(false); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                                >
                                    🏟️ {teamFilter === 'Tutti' ? 'Squadra' : teamFilter}
                                    <ChevronDown size={14} className={`transition ${showTeamDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showTeamDropdown && (
                                    <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                                        <button
                                            onClick={() => { setTeamFilter('Tutti'); setShowTeamDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${teamFilter === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                                        >
                                            Tutte
                                        </button>
                                        {teams.map(team => (
                                            <button
                                                key={team}
                                                onClick={() => { setTeamFilter(team); setShowTeamDropdown(false); }}
                                                className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${teamFilter === team ? 'text-pl-teal' : 'text-gray-300'}`}
                                            >
                                                {team}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Owner Dropdown - Desktop */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowOwnerDropdown(!showOwnerDropdown); setShowTeamDropdown(false); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                                >
                                    👤 {ownerFilter === 'Tutti' ? 'Proprietario' : ownerFilter}
                                    <ChevronDown size={14} className={`transition ${showOwnerDropdown ? 'rotate-180' : ''}`} />
                                </button>
                                {showOwnerDropdown && (
                                    <div className="absolute top-full mt-2 right-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                                        <button
                                            onClick={() => { setOwnerFilter('Tutti'); setShowOwnerDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${ownerFilter === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                                        >
                                            Tutti
                                        </button>
                                        {owners.map(owner => (
                                            <button
                                                key={owner}
                                                onClick={() => { setOwnerFilter(owner); setShowOwnerDropdown(false); }}
                                                className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${ownerFilter === owner ? 'text-pl-teal' : 'text-gray-300'}`}
                                            >
                                                {owner}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile: 3 dropdowns in a row */}
                    <div className="grid grid-cols-3 gap-2 md:hidden">
                        {/* Role Filter Dropdown - Mobile Only */}
                        <div className="relative md:hidden">
                            <button
                                onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowTeamDropdown(false); setShowOwnerDropdown(false); }}
                                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                            >
                                🎯 <span className="truncate">{roleFilter === 'Tutti' ? 'Ruolo' : roleFilter}</span>
                                <ChevronDown size={14} className={`flex-shrink-0 transition ${showRoleDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showRoleDropdown && (
                                <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 min-w-[140px]">
                                    {ROLES.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => { setRoleFilter(role); setShowRoleDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${roleFilter === role ? 'text-pl-teal' : 'text-gray-300'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Team Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowTeamDropdown(!showTeamDropdown); setShowOwnerDropdown(false); setShowRoleDropdown(false); }}
                                className="w-full md:w-auto flex items-center justify-center gap-1 px-3 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                            >
                                🏟️ <span className="truncate">{teamFilter === 'Tutti' ? 'Squadra' : teamFilter}</span>
                                <ChevronDown size={14} className={`flex-shrink-0 transition ${showTeamDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showTeamDropdown && (
                                <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                                    <button
                                        onClick={() => { setTeamFilter('Tutti'); setShowTeamDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${teamFilter === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                                    >
                                        Tutte
                                    </button>
                                    {teams.map(team => (
                                        <button
                                            key={team}
                                            onClick={() => { setTeamFilter(team); setShowTeamDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${teamFilter === team ? 'text-pl-teal' : 'text-gray-300'}`}
                                        >
                                            {team}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Owner Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => { setShowOwnerDropdown(!showOwnerDropdown); setShowTeamDropdown(false); setShowRoleDropdown(false); }}
                                className="w-full md:w-auto flex items-center justify-center gap-1 px-3 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                            >
                                👤 <span className="truncate">{ownerFilter === 'Tutti' ? 'Proprietario' : ownerFilter}</span>
                                <ChevronDown size={14} className={`flex-shrink-0 transition ${showOwnerDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showOwnerDropdown && (
                                <div className="absolute top-full mt-2 right-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                                    <button
                                        onClick={() => { setOwnerFilter('Tutti'); setShowOwnerDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${ownerFilter === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                                    >
                                        Tutti
                                    </button>
                                    {owners.map(owner => (
                                        <button
                                            key={owner}
                                            onClick={() => { setOwnerFilter(owner); setShowOwnerDropdown(false); }}
                                            className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${ownerFilter === owner ? 'text-pl-teal' : 'text-gray-300'}`}
                                        >
                                            {owner}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Players Table */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 text-gray-400 text-sm font-medium uppercase tracking-wider">
                        <div className="col-span-4">Giocatore</div>
                        <div
                            className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white transition"
                            onClick={() => handleSort('position')}
                        >
                            Ruolo
                            {sortKey === 'position' && (
                                sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                        </div>
                        <div
                            className="col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-white transition"
                            onClick={() => handleSort('quotation')}
                        >
                            Quot.
                            {sortKey === 'quotation' && (
                                sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                        </div>
                        <div
                            className="col-span-2 text-center flex items-center justify-center gap-1 cursor-pointer hover:text-white transition"
                            onClick={() => handleSort('purchase_price')}
                        >
                            Acquisto
                            {sortKey === 'purchase_price' && (
                                sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                        </div>
                        <div className="col-span-2">Proprietario</div>
                    </div>

                    {/* Player Rows - Desktop */}
                    <div className="hidden md:block divide-y divide-white/10">
                        {sortedPlayers.slice(0, 100).map(player => (
                            <div
                                key={player.$id}
                                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition group"
                            >
                                {/* Player Name & Team */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <img
                                        src={player.image_url}
                                        alt={player.name}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3d195b&color=fff`;
                                        }}
                                    />
                                    <div>
                                        <div className="font-semibold text-white group-hover:text-pl-teal transition">
                                            {player.name}
                                        </div>
                                        <div className="text-sm text-gray-400">{player.team_short_name}</div>
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="col-span-2 flex items-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[player.position] || ROLE_COLORS['Unknown']}`}>
                                        {ROLE_ABBREV[player.position] || '?'}
                                    </span>
                                </div>

                                {/* Quotation */}
                                <div className="col-span-2 flex items-center justify-center">
                                    <span className="text-xl font-bold text-white">{player.quotation || '—'}</span>
                                </div>

                                {/* Purchase Price */}
                                <div className="col-span-2 flex items-center justify-center">
                                    {player.purchase_price ? (
                                        <span className="text-lg font-medium text-pl-teal">{player.purchase_price}</span>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </div>

                                {/* Owner */}
                                <div className="col-span-2 flex items-center">
                                    <span className={`text-sm ${player.owner ? 'text-gray-300' : 'text-gray-500 italic'}`}>
                                        {player.owner || 'Svincolato'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Player Cards - Mobile */}
                    <div className="md:hidden divide-y divide-white/10">
                        {sortedPlayers.slice(0, 100).map(player => (
                            <div
                                key={player.$id}
                                className="p-4 hover:bg-white/5 transition"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Player Image */}
                                    <img
                                        src={player.image_url}
                                        alt={player.name}
                                        className="w-12 h-12 rounded-full bg-gradient-to-br from-pl-purple to-pl-pink object-cover flex-shrink-0"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3d195b&color=fff`;
                                        }}
                                    />

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[player.position] || ROLE_COLORS['Unknown']}`}>
                                                {ROLE_ABBREV[player.position] || '?'}
                                            </span>
                                            <span className="font-semibold text-white truncate">
                                                {player.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-400 mb-2">{player.team_short_name}</div>

                                        {/* Stats Row */}
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Quot:</span>
                                                <span className="font-bold text-white">{player.quotation || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-gray-500">Acq:</span>
                                                <span className="font-medium text-pl-teal">{player.purchase_price || '—'}</span>
                                            </div>
                                            {player.owner && (
                                                <div className="text-gray-400 truncate">
                                                    👤 {player.owner}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {filteredPlayers.length === 0 && (
                        <div className="px-6 py-12 text-center text-gray-400">
                            Nessun giocatore trovato con i filtri selezionati.
                        </div>
                    )}

                    {/* Load More Notice */}
                    {sortedPlayers.length > 100 && (
                        <div className="px-6 py-4 text-center text-gray-500 text-sm">
                            Mostrati 100 di {sortedPlayers.length} risultati. Usa i filtri per affinare la ricerca.
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};
