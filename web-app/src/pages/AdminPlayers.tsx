import { useState, useEffect, useMemo } from 'react';
import { usePlayers, Player } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { databases, functions, COLL_FANTASY_TEAMS, COLL_PLAYERS, DB_ID } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { Query } from 'appwrite';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, ChevronUp, Save, X, Filter, Loader2, Check, Pen, ClipboardList, Shield, Trash2, Sparkles } from 'lucide-react';
import { ROLES, ROLE_ORDER } from '../constants/players';

const COLL_TEAMS = 'real_teams';




export const AdminPlayers = () => {
    // Players Hook
    // Note: 'players' from hook is usually just an array. We need to handle updates manually for optimistic UI.
    const { players: initialPlayers, loading, error, refresh, teams } = usePlayers();
    const { user, hasRole } = useAuth();

    // Local players state for optimistic updates
    const [localPlayers, setLocalPlayers] = useState<Player[]>([]);

    useEffect(() => {
        setLocalPlayers(initialPlayers);
    }, [initialPlayers]);

    // Local state for editing
    const [managers, setManagers] = useState<{ name: string, id: string }[]>([]);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [realTeams, setRealTeams] = useState<any[]>([]); // Full team objects for blocks

    // Form State
    const [editForm, setEditForm] = useState<any>({});

    // Accordion State for Blocks
    const [openTeamId, setOpenTeamId] = useState<string | null>(null);

    // Helper to find GKs for a team
    const getGKsByTeam = (teamId: string) => {
        return localPlayers.filter(p => p.team_id === teamId && p.position === 'Portiere');
    };

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState('Tutti');
    const [roleFilter, setRoleFilter] = useState('Tutti');
    const [ownerFilter, setOwnerFilter] = useState('Tutti');
    const [showNewOnly, setShowNewOnly] = useState(false); // New Filter for "New Players"

    // Loading state for updates
    const [saving, setSaving] = useState(false);

    // Fetch Managers for Owner Dropdown
    useEffect(() => {
        const fetchManagers = async () => {
            try {
                const res = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                    Query.limit(100),
                    Query.equal('hidden', false)
                ]);
                const managerList = res.documents
                    .filter(d => d.role !== 'g_admin') // Ghost Admin Filter (Role-Based)
                    .map(d => ({
                        name: d.manager_name,
                        id: d.$id
                    }));
                setManagers(managerList);
            } catch (e) {
                console.error("Error fetching managers:", e);
            }
        };
        fetchManagers();
    }, []);

    // Fetch Real Teams for Block Management
    useEffect(() => {
        if (!isBlockModalOpen) return;
        const fetchRealTeams = async () => {
            try {
                const res = await databases.listDocuments(DB_ID, COLL_TEAMS, [Query.limit(50)]);
                setRealTeams(res.documents);
            } catch (e) {
                console.error("Error fetching teams:", e);
            }
        };
        fetchRealTeams();
    }, [isBlockModalOpen]);

    const saveBlockOwner = async (teamId: string, ownerId: string | null, quotation: number, purchasePrice: number) => {
        try {
            // 1. Update Team Block Owner & Quotation
            await databases.updateDocument(DB_ID, COLL_TEAMS, teamId, {
                goalkeeper_owner: ownerId,
                goalkeeper_quotation: quotation,
                goalkeeper_purchase_price: purchasePrice
            });

            // 2. Find all Goalkeepers for this team
            const playersRes = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                Query.equal('team_id', teamId),
                Query.equal('position', 'Portiere'),
                Query.limit(10) // Usually 3-4 GKs max
            ]);

            // 3. Update each player in DB
            const updatePromises = playersRes.documents.map(doc =>
                databases.updateDocument(DB_ID, COLL_PLAYERS, doc.$id, {
                    owner: ownerId
                })
            );
            await Promise.all(updatePromises);

            // 4. Update Local State (Teams & Players)
            setRealTeams(prev => prev.map(t => t.$id === teamId ? { ...t, goalkeeper_owner: ownerId, goalkeeper_quotation: quotation, goalkeeper_purchase_price: purchasePrice } : t));
            setLocalPlayers(prev => prev.map(p =>
                (p.team_id === teamId && p.position === 'Portiere')
                    ? { ...p, owner: ownerId }
                    : p
            ));

        } catch (e) {
            console.error("Error saving block:", e);
            alert("Errore salvataggio blocco: " + (e as any).message);
        }
    };

    const openEditModal = (player: Player) => {
        setEditingPlayer(player);
        setEditForm({
            position: player.position,
            quotation: player.quotation || 0,
            purchase_price: player.purchase_price || 0,
            owner: player.owner || ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlayer(null);
        setEditForm({});
    };

    const savePlayer = async () => {
        if (!editingPlayer) return;
        setSaving(true);

        const updatedData = {
            position: editForm.position,
            quotation: parseInt(editForm.quotation),
            purchase_price: parseInt(editForm.purchase_price),
            owner: editForm.owner === '' ? null : editForm.owner
        };

        // Optimistic Update
        const updatedPlayer = { ...editingPlayer, ...updatedData } as Player; // Cast because 'owner' might be null
        setLocalPlayers(prev => prev.map(p => p.$id === editingPlayer.$id ? { ...p, ...updatedData } : p));

        closeModal(); // Close immediately

        try {
            await databases.updateDocument(DB_ID, COLL_PLAYERS, editingPlayer.$id, updatedData);
            // Success - state already updated optimistically
        } catch (e: any) {
            console.error("Save error:", e);
            alert(`Errore salvataggio: ${e.message}`);
            refresh(); // Revert on error
        } finally {
            setSaving(false);
        }
    };

    const deletePlayer = async (e: React.MouseEvent, player: Player) => {
        e.stopPropagation();
        if (!window.confirm(`Sei sicuro di voler eliminare definitivamente ${player.name}?`)) return;

        setSaving(true);
        try {
            await databases.deleteDocument(DB_ID, COLL_PLAYERS, player.$id);
            // Optimistic deletion
            setLocalPlayers(prev => prev.filter(p => p.$id !== player.$id));
        } catch (e: any) {
            console.error("Delete error:", e);
            alert(`Errore eliminazione: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // Function ID for reset_squads - UPDATE THIS after deploying the function!
    const RESET_FUNCTION_ID = 'reset_squads';

    const resetAllSquads = async () => {
        if (!window.confirm('⚠️ SEI SICURO?\n\nQuesto svuoterà TUTTE le rose:\n- Rimuoverà proprietari da tutti i giocatori\n- Resetterà prezzi a 0\n- Le QUOTAZIONI rimangono invariate\n\nQuesta azione NON può essere annullata!')) return;

        setSaving(true);
        try {
            // Call server-side function (no rate limiting!)
            const execution = await functions.createExecution(RESET_FUNCTION_ID, '{}', true);

            if (execution.status === 'completed') {
                const response = execution.responseBody ? JSON.parse(execution.responseBody) : {};
                if (response.success) {
                    alert(`✅ Rose svuotate!\n\nGiocatori: ${response.playersReset}\nBlocchi: ${response.teamsReset}`);
                    refresh();
                } else {
                    alert(`Errore: ${response.error}`);
                }
            } else {
                alert('⏳ Reset in corso (background). Ricarica la pagina tra qualche secondo.');
                setTimeout(refresh, 3000);
            }

        } catch (e: any) {
            console.error("Reset error:", e);
            alert(`Errore reset: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    // 4. Filter & Sort
    const filteredAndSortedPlayers = useMemo(() => {
        let result = localPlayers;

        // NEW: Hide Goalkeepers from Admin List (Managed via Blocks)
        result = result.filter(p => p.position !== 'Portiere');

        // Text Search
        if (searchQuery) {
            const lowQuery = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(lowQuery) || p.team_short_name.toLowerCase().includes(lowQuery));
        }

        // Dropdown Filters
        if (teamFilter !== 'Tutti') {
            result = result.filter(p => p.team_short_name === teamFilter);
        }
        if (roleFilter !== 'Tutti') {
            result = result.filter(p => p.position === roleFilter);
        }
        if (ownerFilter !== 'Tutti') {
            if (ownerFilter === 'Svincolati') {
                result = result.filter(p => !p.owner);
            } else {
                result = result.filter(p => p.owner === ownerFilter);
            }
        }

        // "New" Filter: Show ONLY players from the last sync (detected by proximity to the latest created_at)
        if (showNewOnly && localPlayers.length > 0) {
            const timestamps = localPlayers.map(p => new Date(p.created_at).getTime());
            const latestTimestamp = Math.max(...timestamps);
            // Assume a sync takes at most 20 minutes. We show players created in that "last batch".
            const threshold = latestTimestamp - (20 * 60 * 1000); // 20 minutes

            return result.filter(p => new Date(p.created_at).getTime() > threshold)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        // Standard Sorting: Role Priority -> Team Alphabetical -> Quotation Descending -> Name Alphabetical
        return result.sort((a, b) => {
            const roleDiff = (ROLE_ORDER[a.position] || 99) - (ROLE_ORDER[b.position] || 99);
            if (roleDiff !== 0) return roleDiff;

            const teamDiff = (a.team_short_name || '').localeCompare(b.team_short_name || '');
            if (teamDiff !== 0) return teamDiff;

            // Quotation descending
            const quotationDiff = (b.quotation || 0) - (a.quotation || 0);
            if (quotationDiff !== 0) return quotationDiff;

            return a.name.localeCompare(b.name);
        });
    }, [localPlayers, searchQuery, teamFilter, roleFilter, ownerFilter, showNewOnly]);


    if (loading && localPlayers.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-pl-teal" /></div>;

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center gap-2 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-3">
                    <ClipboardList className="text-pl-teal w-8 h-8" />
                    Gestione Listone
                </h1>
                <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">
                    Modifica ruoli, quotazioni e proprietari. Le modifiche sono istantanee.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <button
                        onClick={() => setIsBlockModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-pl-teal/10 text-pl-teal rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-pl-teal/20 transition border border-pl-teal/20"
                    >
                        <Shield size={14} />
                        Gestione Blocchi Portieri
                    </button>

                    {/* Only visible to Ghost Admin */}
                    {hasRole('g_admin') && (
                        <button
                            onClick={resetAllSquads}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition border border-red-500/20 disabled:opacity-50"
                        >
                            <Trash2 size={14} />
                            Svuota Rose
                        </button>
                    )}
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-2 mt-4 w-full max-w-2xl justify-center">
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
                        className={`h-[42px] px-4 rounded-xl border flex items-center gap-2 text-sm font-bold transition whitespace-nowrap w-full md:w-auto ${showNewOnly
                            ? 'bg-pl-teal text-pl-dark border-pl-teal'
                            : 'bg-black/30 border-white/10 text-gray-300 hover:bg-black/40'
                            }`}
                    >
                        <Sparkles size={16} />
                        {showNewOnly ? 'Nuovi' : 'Nuovi'}
                    </button>

                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-auto"
                    >
                        <option value="Tutti">Tutti i Ruoli</option>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select
                        value={teamFilter}
                        onChange={e => setTeamFilter(e.target.value)}
                        className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-auto"
                    >
                        <option value="Tutti">Tutte le Squadre</option>
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <select
                        value={ownerFilter}
                        onChange={e => setOwnerFilter(e.target.value)}
                        className="h-[42px] bg-black/30 border border-white/10 rounded-xl px-4 text-sm text-gray-300 outline-none hover:bg-black/40 transition cursor-pointer w-full md:w-auto"
                    >
                        <option value="Tutti">Tutti i Proprietari</option>
                        <option value="Svincolati">Svincolati</option>
                        {managers.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                    </select>
                </div>

                {/* Desktop Table Container */}
                <div className="hidden md:block bg-[#1e1e24] border border-white/5 rounded-2xl overflow-hidden shadow-2xl max-w-6xl mx-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-base">
                            <thead className="bg-black/40 text-gray-400 font-bold uppercase text-sm tracking-wider sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4">Giocatore</th>
                                    <th className="px-6 py-4 w-40">Ruolo</th>
                                    <th className="px-6 py-4 w-32 text-center">Quotazione</th>
                                    <th className="px-6 py-4 w-32 text-center">Prezzo</th>
                                    <th className="px-6 py-4 w-56">Proprietario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredAndSortedPlayers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                                            Nessun giocatore trovato
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAndSortedPlayers.slice(0, 150).map(player => (
                                        <tr
                                            key={player.$id}
                                            onClick={() => openEditModal(player)}
                                            className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                                        >
                                            {/* NAME */}
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    {/* Optional: Add Image Avatar here if available */}
                                                    <div className="flex flex-col">
                                                        <span className={`font-semibold transition-colors text-base flex items-center gap-2 ${!player.is_active ? 'text-gray-500 italic decoration-slate-600' : 'text-white group-hover:text-pl-teal'}`}>
                                                            {player.name} {!player.is_active && '*'}
                                                            {!player.is_active && (
                                                                <button
                                                                    onClick={(e) => deletePlayer(e, player)}
                                                                    title="Elimina definitivamente"
                                                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1 rounded transition ml-2"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </span>
                                                        <span className={`text-xs uppercase tracking-wide font-medium ${!player.is_active ? 'text-gray-600' : 'text-gray-500'}`}>{player.team_short_name}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* ROLE */}
                                            <td className="px-6 py-3">
                                                <span className={`px-2.5 py-1 rounded-md text-xs uppercase font-bold tracking-widest border border-current opacity-80
                                                ${player.position === 'Portiere' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' :
                                                        player.position === 'Difensore' ? 'text-blue-500 border-blue-500/20 bg-blue-500/10' :
                                                            player.position === 'Centrocampista' ? 'text-green-500 border-green-500/20 bg-green-500/10' :
                                                                'text-red-500 border-red-500/20 bg-red-500/10'}`}>
                                                    {player.position}
                                                </span>
                                            </td>

                                            {/* QUOTATION */}
                                            <td className="px-6 py-3 text-center">
                                                <span className="text-gray-300 font-mono text-base">{player.quotation}</span>
                                            </td>

                                            {/* PRICE */}
                                            <td className="px-6 py-3 text-center">
                                                <span className={`font-mono text-base ${player.purchase_price > 0 ? 'text-pl-teal font-bold' : 'text-gray-600'}`}>
                                                    {player.purchase_price || '-'}
                                                </span>
                                            </td>

                                            {/* OWNER */}
                                            <td className="px-6 py-3">
                                                {player.owner ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-pl-teal shadow-[0_0_8px_rgba(56,189,248,0.5)]"></div>
                                                        <span className="text-sm text-white font-medium">{player.owner}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-600 italic">Svincolato</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Mobile Cards Container */}
                <div className="md:hidden space-y-3 pb-20 w-full max-w-2xl mx-auto">
                    {filteredAndSortedPlayers.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 bg-white/5 rounded-xl border border-white/5">
                            Nessun risultato
                        </div>
                    ) : (
                        filteredAndSortedPlayers.slice(0, 50).map(player => (
                            <div
                                key={player.$id}
                                onClick={() => openEditModal(player)}
                                className="bg-[#1e1e24] border border-white/5 rounded-xl p-4 active:scale-[0.98] transition-all cursor-pointer shadow-lg relative overflow-hidden"
                            >
                                {/* Role Stripe */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${player.position === 'Portiere' ? 'bg-yellow-500' :
                                    player.position === 'Difensore' ? 'bg-blue-500' :
                                        player.position === 'Centrocampista' ? 'bg-green-500' :
                                            'bg-red-500'
                                    }`} />

                                <div className="flex justify-between items-start pl-3">
                                    <div className="flex-1 min-w-0 pr-2 text-left">
                                        <h3 className={`font-bold text-base flex items-center justify-start gap-2 ${!player.is_active ? 'text-gray-500 italic' : 'text-white'}`}>
                                            <span className="truncate">{player.name}</span>
                                            {!player.is_active && '*'}
                                            {!player.is_active && (
                                                <button
                                                    onClick={(e) => deletePlayer(e, player)}
                                                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white p-1 rounded-full transition flex-shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </h3>
                                        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mt-0.5 mb-1 truncate">
                                            {player.team_short_name || player.team_name || '-'}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Prezzo</div>
                                        <div className={`font-mono font-bold ${player.purchase_price > 0 ? 'text-pl-teal' : 'text-gray-600'}`}>
                                            {player.purchase_price || '-'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between pl-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Quotazione</span>
                                        <span className="text-sm text-white font-mono">{player.quotation}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Proprietario</span>
                                        {player.owner ? (
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-pl-teal shadow-[0_0_6px_rgba(56,189,248,0.5)]"></div>
                                                <span className="text-xs text-white font-medium">{player.owner}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-600 italic mt-0.5">Svincolato</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {filteredAndSortedPlayers.length > 50 && (
                        <div className="py-3 text-center text-xs text-gray-600">
                            Mostrati primi 50. Usa i filtri.
                        </div>
                    )}
                </div>
            </div>

            {
                isModalOpen && editingPlayer && createPortal(
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        {/* Backdrop - Clean, no blur to avoid artifacts */}
                        <div
                            className="absolute inset-0 bg-black/80 transition-opacity animate-in fade-in duration-200"
                            onClick={closeModal}
                        />

                        {/* Modal Container - Premium Card Style */}
                        <div
                            className="relative w-full max-w-lg mx-4 bg-[#18181b] rounded-2xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-pl-teal/50 to-transparent"></div>

                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Pen size={18} className="text-pl-teal" />
                                        Modifica Giocatore
                                    </h2>
                                    <p className="text-gray-400 text-sm mt-1">{editingPlayer.name} ({editingPlayer.team_short_name})</p>
                                </div>
                                <button onClick={closeModal} className="text-gray-500 hover:text-white transition p-2 hover:bg-white/10 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            {/* Modal Body */}
                            <div className="p-6 space-y-5">

                                {/* Role Select */}
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Ruolo Fanta</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {ROLES.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setEditForm({ ...editForm, position: role })}
                                                className={`py-2 px-1 rounded-lg text-[10px] font-bold uppercase transition border ${editForm.position === role
                                                    ? role === 'Portiere' ? 'bg-yellow-500 text-black border-yellow-500' :
                                                        role === 'Difensore' ? 'bg-blue-500 text-white border-blue-500' :
                                                            role === 'Centrocampista' ? 'bg-green-500 text-white border-green-500' :
                                                                'bg-red-500 text-white border-red-500'
                                                    : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Quotation */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Quotazione</label>
                                        <input
                                            type="number"
                                            value={editForm.quotation}
                                            onChange={e => setEditForm({ ...editForm, quotation: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition font-mono"
                                        />
                                    </div>
                                    {/* Price */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Prezzo Acquisto</label>
                                        <input
                                            type="number"
                                            value={editForm.purchase_price}
                                            onChange={e => setEditForm({ ...editForm, purchase_price: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Owner */}
                                {/* Owner */}
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-gray-500 tracking-wider flex justify-between">
                                        Proprietario
                                        {editForm.position === 'Portiere' && <span className="text-pl-teal text-[10px] items-center flex gap-1"><Shield size={10} /> Gestito da Blocco Squadra</span>}
                                    </label>
                                    <select
                                        value={editForm.owner}
                                        onChange={e => setEditForm({ ...editForm, owner: e.target.value })}
                                        disabled={editForm.position === 'Portiere'}
                                        className={`w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pl-teal outline-none transition ${editForm.position === 'Portiere' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">-- Svincolato --</option>
                                        {managers.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-black/20 rounded-b-2xl">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={savePlayer}
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-pl-dark bg-pl-teal hover:bg-pl-teal/90 transition shadow-lg shadow-pl-teal/20 flex items-center gap-2"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Salva Modifiche
                                </button>
                            </div>

                        </div>
                    </div>,
                    document.body
                )
            }

            {/* BLOCK MANAGEMENT MODAL */}

            {/* BLOCK MANAGEMENT MODAL */}
            {
                isBlockModalOpen && createPortal(
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsBlockModalOpen(false)} />
                        <div className="relative w-full max-w-2xl bg-[#18181b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh]">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <div>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Shield className="text-pl-teal" size={20} />
                                        Blocchi Portieri
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-1">Assegna l'intero reparto portieri a un manager.</p>
                                </div>
                                <button onClick={() => setIsBlockModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"><X size={20} /></button>
                            </div>

                            <div className="p-4 md:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                                {realTeams.sort((a, b) => (a.short_name || '').localeCompare(b.short_name || '')).map(team => {
                                    const isOpen = openTeamId === team.$id;
                                    const teamGKs = getGKsByTeam(team.$id);

                                    return (
                                        <div key={team.$id} className="bg-[#1e1e24] border border-white/5 rounded-xl overflow-hidden shadow-lg transition-all hover:border-white/10">
                                            {/* Header Row (Always Visible) */}
                                            <div
                                                className="p-4 flex items-center justify-between cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition"
                                                onClick={() => setOpenTeamId(isOpen ? null : team.$id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* PROPER TEAM LOGO or Fallback */}
                                                    <div className="w-10 h-10 flex-shrink-0">
                                                        {team.logo_url ? (
                                                            <img
                                                                src={team.logo_url}
                                                                alt={team.short_name}
                                                                className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center font-bold text-gray-500 text-xs shadow-inner">
                                                                {team.short_name ? team.short_name.substring(0, 3) : team.name.substring(0, 3)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* SHORT NAME ONLY (Requested by User) */}
                                                    <div>
                                                        <h3 className="text-white font-bold text-lg tracking-wide">{team.short_name || team.name}</h3>
                                                        <div className="text-xs text-gray-400 mt-0.5 font-medium">
                                                            {teamGKs.length} Portieri
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-white/10' : ''}`}>
                                                    <ChevronDown size={20} className="text-gray-400" />
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isOpen && (
                                                <div className="p-4 border-t border-white/5 bg-black/20 space-y-6 animate-in slide-in-from-top-2 duration-200">

                                                    {/* Management Controls */}
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                                        {/* Owner Select */}
                                                        <div className="md:col-span-6 space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Proprietario Blocco</label>
                                                            <select
                                                                value={team.goalkeeper_owner || ''}
                                                                onChange={(e) => saveBlockOwner(team.$id, e.target.value || null, team.goalkeeper_quotation || 0, team.goalkeeper_purchase_price || 0)}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-pl-teal outline-none transition"
                                                            >
                                                                <option value="">-- Svincolato --</option>
                                                                {managers.map(m => (
                                                                    <option key={m.id} value={m.name}>{m.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Quotation */}
                                                        <div className="md:col-span-3 space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Quot. Totale</label>
                                                            <input
                                                                type="number"
                                                                value={team.goalkeeper_quotation || 0}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    setRealTeams(prev => prev.map(t => t.$id === team.$id ? { ...t, goalkeeper_quotation: val } : t));
                                                                }}
                                                                onBlur={(e) => saveBlockOwner(team.$id, team.goalkeeper_owner, parseInt(e.target.value), team.goalkeeper_purchase_price || 0)}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-pl-teal outline-none font-mono text-center"
                                                            />
                                                        </div>

                                                        {/* Price */}
                                                        <div className="md:col-span-3 space-y-1.5">
                                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Prezzo Asta</label>
                                                            <input
                                                                type="number"
                                                                value={team.goalkeeper_purchase_price || 0}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    setRealTeams(prev => prev.map(t => t.$id === team.$id ? { ...t, goalkeeper_purchase_price: val } : t));
                                                                }}
                                                                onBlur={(e) => saveBlockOwner(team.$id, team.goalkeeper_owner, team.goalkeeper_quotation || 0, parseInt(e.target.value))}
                                                                onClick={e => e.stopPropagation()}
                                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-pl-teal font-bold focus:border-pl-teal outline-none font-mono text-center"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* GK List */}
                                                    <div>
                                                        <h4 className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2 flex items-center gap-2">
                                                            <Shield size={10} />
                                                            Portieri Inclusi
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {teamGKs.map(p => (
                                                                <div key={p.$id} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_4px_currentColor]`}></div>
                                                                        <span className={`text-sm ${!p.is_active ? 'text-gray-500 italic line-through' : 'text-gray-300'}`}>{p.name}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {teamGKs.length === 0 && <div className="text-xs text-gray-600 italic">Nessun portiere trovato.</div>}
                                                        </div>
                                                    </div>

                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>, document.body)
            }

        </div >
    );
};
