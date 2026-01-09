import { Search, Sparkles, UserX, X } from 'lucide-react';
import { ROLES } from '../../../constants/players';
import { Manager } from './types';

interface AdminPlayerFiltersProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    showNewOnly: boolean;
    setShowNewOnly: (val: boolean) => void;
    showInactiveOnly: boolean;
    setShowInactiveOnly: (val: boolean) => void;
    roleFilter: string;
    setRoleFilter: (val: string) => void;
    teamFilter: string;
    setTeamFilter: (val: string) => void;
    ownerFilter: string;
    setOwnerFilter: (val: string) => void;
    teams: string[];
    managers: Manager[];
    onReset: () => void;
}

export const AdminPlayerFilters = ({
    searchQuery, setSearchQuery,
    showNewOnly, setShowNewOnly,
    showInactiveOnly, setShowInactiveOnly,
    roleFilter, setRoleFilter,
    teamFilter, setTeamFilter,
    ownerFilter, setOwnerFilter,
    teams, managers, onReset
}: AdminPlayerFiltersProps) => {

    const hasActiveFilters = searchQuery || showNewOnly || showInactiveOnly || roleFilter !== 'Tutti' || teamFilter !== 'Tutti' || ownerFilter !== 'Tutti';

    return (
        <div className="flex flex-col md:flex-row flex-wrap gap-2 mt-4 w-full justify-center">
            <div className="relative group w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-pl-teal transition-colors w-4 h-4" />
                <input
                    type="text"
                    placeholder="Cerca..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="h-[42px] bg-black/30 border border-white/10 rounded-xl pl-9 pr-4 text-sm text-white w-full md:w-56 focus:border-pl-teal/50 outline-none transition-all placeholder-gray-600 focus:bg-black/50"
                />
            </div>

            <button
                onClick={() => setShowNewOnly(!showNewOnly)}
                className={`h-[42px] px-4 rounded-xl border flex items-center justify-start gap-2 text-sm font-bold transition whitespace-nowrap w-full md:w-fit ${showNewOnly
                    ? 'bg-pl-teal text-pl-dark border-pl-teal'
                    : 'bg-black/30 border-white/10 text-gray-300 hover:bg-black/40'
                    }`}
            >
                <Sparkles size={16} />
                {showNewOnly ? 'Nuovi' : 'Nuovi'}
            </button>

            <button
                onClick={() => setShowInactiveOnly(!showInactiveOnly)}
                className={`h-[42px] px-4 rounded-xl border flex items-center justify-start gap-2 text-sm font-bold transition whitespace-nowrap w-full md:w-fit ${showInactiveOnly
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-black/30 border-white/10 text-gray-300 hover:bg-black/40'
                    }`}
                title="Mostra solo inattivi"
            >
                <UserX size={16} />
                Inattivi
            </button>

            <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-fit text-left"
            >
                <option value="Tutti">Tutti i Ruoli</option>
                {ROLES.filter(r => r !== 'Portiere').map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
                value={teamFilter}
                onChange={e => setTeamFilter(e.target.value)}
                className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-fit text-left"
            >
                <option value="Tutti">Tutte le Squadre</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
                value={ownerFilter}
                onChange={e => setOwnerFilter(e.target.value)}
                className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-fit text-left"
            >
                <option value="Tutti">Tutti i Proprietari</option>
                <option value="Svincolati">Svincolati</option>
                {managers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                ))}
            </select>

            {/* Reset Filters X */}
            {hasActiveFilters && (
                <button
                    onClick={onReset}
                    className="h-[42px] w-[42px] rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition"
                    title="Resetta Filtri"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
};
