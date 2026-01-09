import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { ROLES_WITH_ALL as ROLES } from '../../constants/players';

interface PlayerFiltersProps {
    teams: string[];
    currentRole: string;
    onRoleChange: (role: string) => void;
    currentTeam: string;
    onTeamChange: (team: string) => void;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export function PlayerFilters({
    teams,
    currentRole,
    onRoleChange,
    currentTeam,
    onTeamChange,
    hasActiveFilters,
    onResetFilters
}: PlayerFiltersProps) {
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);

    return (
        <div className="mb-6">
            {/* Desktop: All filters in one row */}
            <div className="hidden md:flex items-center justify-between">
                {/* Role Pills - Left */}
                <div className="flex gap-2 flex-wrap">
                    {ROLES.map(role => (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${currentRole === role
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
                            onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                        >
                            🏟️ {currentTeam === 'Tutti' ? 'Squadra' : currentTeam}
                            <ChevronDown size={14} className={`transition ${showTeamDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showTeamDropdown && (
                            <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                                <button
                                    onClick={() => { onTeamChange('Tutti'); setShowTeamDropdown(false); }}
                                    className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${currentTeam === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                                >
                                    Tutte
                                </button>
                                {teams.map(team => (
                                    <button
                                        key={team}
                                        onClick={() => { onTeamChange(team); setShowTeamDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${currentTeam === team ? 'text-pl-teal' : 'text-gray-300'}`}
                                    >
                                        {team}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: 3 dropdowns in a row */}
            <div className="flex gap-2 md:hidden">
                {/* Role Filter Dropdown - Mobile Only */}
                <div className="relative flex-1 md:hidden">
                    <button
                        onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowTeamDropdown(false); }}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                    >
                        🎯 <span className="truncate">{currentRole === 'Tutti' ? 'Ruolo' : currentRole}</span>
                        <ChevronDown size={14} className={`flex-shrink-0 transition ${showRoleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showRoleDropdown && (
                        <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 min-w-[140px]">
                            {ROLES.map(role => (
                                <button
                                    key={role}
                                    onClick={() => { onRoleChange(role); setShowRoleDropdown(false); }}
                                    className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${currentRole === role ? 'text-pl-teal' : 'text-gray-300'}`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Team Dropdown */}
                <div className="relative flex-1">
                    <button
                        onClick={() => { setShowTeamDropdown(!showTeamDropdown); setShowRoleDropdown(false); }}
                        className="w-full md:w-auto flex items-center justify-center gap-1 px-3 py-2 bg-white/10 rounded-full text-gray-300 hover:bg-white/20 transition text-sm"
                    >
                        🏟️ <span className="truncate">{currentTeam === 'Tutti' ? 'Squadra' : currentTeam}</span>
                        <ChevronDown size={14} className={`flex-shrink-0 transition ${showTeamDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showTeamDropdown && (
                        <div className="absolute top-full mt-2 left-0 bg-pl-dark border border-white/20 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto min-w-[180px]">
                            <button
                                onClick={() => { onTeamChange('Tutti'); setShowTeamDropdown(false); }}
                                className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${currentTeam === 'Tutti' ? 'text-pl-teal' : 'text-gray-300'}`}
                            >
                                Tutte
                            </button>
                            {teams.map(team => (
                                <button
                                    key={team}
                                    onClick={() => { onTeamChange(team); setShowTeamDropdown(false); }}
                                    className={`w-full text-left px-4 py-2 hover:bg-white/10 transition text-sm ${currentTeam === team ? 'text-pl-teal' : 'text-gray-300'}`}
                                >
                                    {team}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Mobile Reset Filters X */}
                {hasActiveFilters && (
                    <button
                        onClick={onResetFilters}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-full text-sm font-bold transition border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex-shrink-0"
                        title="Resetta Filtri"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>
    );
}
