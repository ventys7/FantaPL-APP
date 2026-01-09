import { useState, useEffect, useMemo } from 'react';
import { usePlayers, Player } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { databases, functions, COLL_FANTASY_TEAMS, COLL_PLAYERS, DB_ID } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { matchesSearch } from '../lib/textUtils';
import { Query } from 'appwrite';
import { ClipboardList, Shield, Trash2, Loader2 } from 'lucide-react';
import { ROLE_ORDER } from '../constants/players';
import { AdminPlayerEditModal, AdminBlockModal, AdminPlayerFilters, AdminPlayerList, RealTeam, PlayerEditForm, Manager } from '../components/admin/players';

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
    const [managers, setManagers] = useState<Manager[]>([]);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
    const [realTeams, setRealTeams] = useState<RealTeam[]>([]);

    // Helper to find GKs for a team
    const getGKsByTeam = (teamId: string) => {
        return localPlayers.filter(p => p.team_id === teamId && p.position === 'Portiere');
    };

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [teamFilter, setTeamFilter] = useState('Tutti');
    const [roleFilter, setRoleFilter] = useState('Tutti');
    const [ownerFilter, setOwnerFilter] = useState('Tutti');
    const [showNewOnly, setShowNewOnly] = useState(false);
    const [showInactiveOnly, setShowInactiveOnly] = useState(false);

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
                logger.error("Error fetching managers", { error: e });
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
                // Map appwrite docs to RealTeam type
                const mappedTeams: RealTeam[] = res.documents.map((d: any) => ({
                    $id: d.$id,
                    name: d.name,
                    short_name: d.short_name,
                    logo_url: d.logo_url,
                    goalkeeper_owner: d.goalkeeper_owner,
                    goalkeeper_quotation: d.goalkeeper_quotation,
                    goalkeeper_purchase_price: d.goalkeeper_purchase_price
                }));
                setRealTeams(mappedTeams);
            } catch (e) {
                console.error("Error fetching teams:", e);
                logger.error("Error fetching real teams", { error: e });
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
            logger.error("Error saving block", { error: e });
            alert("Errore salvataggio blocco: " + (e as any).message);
        }
    };

    const updateTeamLocal = (teamId: string, updates: Partial<RealTeam>) => {
        setRealTeams(prev => prev.map(t => t.$id === teamId ? { ...t, ...updates } : t));
    };

    const openEditModal = (player: Player) => {
        setEditingPlayer(player);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlayer(null);
    };

    const savePlayer = async (player: Player, data: PlayerEditForm) => {
        const updatedData = {
            position: (data.position || player.position) as Player['position'],
            quotation: typeof data.quotation === 'string' ? parseInt(data.quotation) : (data.quotation || player.quotation),
            purchase_price: typeof data.purchase_price === 'string' ? parseInt(data.purchase_price) : (data.purchase_price || player.purchase_price),
            owner: data.owner === '' ? null : (data.owner === undefined ? player.owner : data.owner)
        };

        // Optimistic Update
        const updatedPlayer = { ...player, ...updatedData } as Player;
        setLocalPlayers(prev => prev.map(p => p.$id === player.$id ? { ...p, ...updatedData } : p));

        closeModal();

        try {
            // @ts-ignore - quotation/price types mismatch in appwrite types sometimes
            await databases.updateDocument(DB_ID, COLL_PLAYERS, player.$id, updatedData);
        } catch (e: any) {
            console.error("Save error:", e);
            logger.error("Error saving player", { error: e });
            alert(`Errore salvataggio: ${e.message}`);
            refresh(); // Revert on error
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
            logger.error("Error deleting player", { error: e, playerId: player.$id });
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
            logger.error("Error resetting squads", { error: e });
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

        // Text Search (player name only, accent-insensitive)
        if (searchQuery) {
            result = result.filter(p => matchesSearch(p.name, searchQuery));
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

        // Inactive Filter: Show ONLY inactive players
        if (showInactiveOnly) {
            result = result.filter(p => !p.is_active);
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
    }, [localPlayers, searchQuery, teamFilter, roleFilter, ownerFilter, showNewOnly, showInactiveOnly]);


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

                {/* Filters */}
                <AdminPlayerFilters
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showNewOnly={showNewOnly}
                    setShowNewOnly={setShowNewOnly}
                    showInactiveOnly={showInactiveOnly}
                    setShowInactiveOnly={setShowInactiveOnly}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                    teamFilter={teamFilter}
                    setTeamFilter={setTeamFilter}
                    ownerFilter={ownerFilter}
                    setOwnerFilter={setOwnerFilter}
                    teams={teams}
                    managers={managers}
                    onReset={() => {
                        setSearchQuery('');
                        setShowNewOnly(false);
                        setShowInactiveOnly(false);
                        setRoleFilter('Tutti');
                        setTeamFilter('Tutti');
                        setOwnerFilter('Tutti');
                    }}
                />

                {/* Player List */}
                <AdminPlayerList
                    players={filteredAndSortedPlayers}
                    onEdit={openEditModal}
                    onDelete={deletePlayer}
                />
            </div>

            {/* Edit Modal */}
            <AdminPlayerEditModal
                isOpen={isModalOpen}
                player={editingPlayer}
                managers={managers}
                onClose={closeModal}
                onSave={savePlayer}
            />

            {/* Block Modal */}
            <AdminBlockModal
                isOpen={isBlockModalOpen}
                realTeams={realTeams}
                managers={managers}
                onClose={() => setIsBlockModalOpen(false)}
                onSaveBlock={saveBlockOwner}
                onUpdateTeamLocal={updateTeamLocal}
                getGKsByTeam={getGKsByTeam}
            />

        </div >
    );
};
