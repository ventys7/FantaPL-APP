import { useState, useCallback, useEffect } from 'react';
import { account, databases, functions, COLL_FANTASY_TEAMS, DB_ID } from '../lib/appwrite';
import { ID, Query, ExecutionMethod } from 'appwrite';
import { User, UserRole } from '../types/shared';

// Constants
const GHOST_ADMIN_ID = '695842e1003a3db19fea';

type SortKey = 'name' | 'role';
type SortDirection = 'asc' | 'desc';

export const useParticipantManager = (currentUser: any) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'name',
        direction: 'asc'
    });

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                Query.limit(100)
            ]);

            const mappedUsers = response.documents.map(doc => ({
                $id: doc.user_id || doc.$id,
                name: doc.manager_name,
                credits: doc.credits_remaining ?? 500,
                email: 'N/A',
                status: !doc.hidden,
                prefs: {
                    role: doc.role as UserRole,
                    teamId: doc.$id
                }
            })) as unknown as User[];

            // Filter Ghost Admin: Visible ONLY to himself
            const filteredUsers = mappedUsers.filter(u =>
                u.prefs.role !== 'g_admin' || currentUser?.$id === u.$id
            );

            setUsers(filteredUsers);
        } catch (error) {
            console.error('Error loading participants:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedUsers = useCallback(() => {
        let sorted = [...users];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sorted = sorted.filter(u => u.name.toLowerCase().includes(term));
        }

        sorted.sort((a, b) => {
            // 1. PRIMARY SORT: Status (Active First)
            if (a.status !== b.status) {
                return a.status ? -1 : 1;
            }

            // 2. SECONDARY SORT
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'role') {
                aValue = a.prefs.role || '';
                bValue = b.prefs.role || '';
            } else {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [users, searchTerm, sortConfig]);

    const handleCreateUser = async (name: string, username: string, password: string, role: UserRole) => {
        try {
            const email = `${username.toLowerCase().replace(/\s+/g, '')}@fantapl.app`;
            const identity = await account.create(ID.unique(), email, password, name);

            await databases.createDocument(DB_ID, COLL_FANTASY_TEAMS, ID.unique(), {
                user_id: identity.$id,
                manager_name: name,
                team_name: `Squadra di ${name}`,
                credits_remaining: 500,
                role: role,
                hidden: false,
                force_pass_reset: true
            });

            alert(`Utente ${name} creato con successo! Username: ${username}`);
            loadUsers();
            return true;
        } catch (error: any) {
            console.error(error);
            if (error.code === 409) {
                alert('ERRORE: Questo Username o Email esiste già nel sistema Auth di Appwrite. Cambia username o elimina l\'utente dalla Console di Appwrite.');
            } else {
                alert(`Errore creazione: ${error.message}`);
            }
            return false;
        }
    };

    const handleDelete = async (docId: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare il profilo di ${name}?`)) return;
        try {
            await databases.deleteDocument(DB_ID, COLL_FANTASY_TEAMS, docId);
            alert('Profilo database eliminato. Ricordati di rimuovere l\'utente anche dalla Console Appwrite (Auth) per liberare l\'username.');
            loadUsers();
        } catch (e: any) {
            console.error(e);
            alert(`Errore eliminazione: ${e.message}`);
        }
    };

    const handleResetPassword = async (docId: string, name: string, userId: string) => {
        const tempPassword = prompt(`Inserisci la NUOVA PASSWORD provvisoria per ${name}:`);
        if (!tempPassword) return;
        if (tempPassword.length < 8) {
            alert('La password deve essere di almeno 8 caratteri.');
            return;
        }

        if (!confirm(`Confermi di voler assegnare la password "${tempPassword}" a ${name}?`)) return;

        setLoading(true);
        try {
            const FUNCTION_ID = 'admin-password-reset';

            const execution = await functions.createExecution(
                FUNCTION_ID,
                JSON.stringify({
                    userId: userId,
                    newPassword: tempPassword,
                    adminId: currentUser?.$id
                }),
                false, // async
                '/',   // path
                ExecutionMethod.POST // method
            );

            const result = JSON.parse(execution.responseBody);

            if (!result.success) {
                throw new Error(result.error);
            }

            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, {
                force_pass_reset: true
            });

            alert(`Password aggiornata correttamente! ${name} ora può accedere con "${tempPassword}".`);
        } catch (e: any) {
            console.error(e);
            alert(`Errore reset password: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRole = async (docId: string, newRole: UserRole, name: string) => {
        try {
            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, { role: newRole });
            alert(`Ruolo di ${name} aggiornato a ${newRole.toUpperCase()}`);
            loadUsers();
        } catch (e: any) {
            alert(`Errore aggiornamento ruolo: ${e.message}`);
        }
    };

    const handleToggleStatus = async (docId: string, currentStatus: boolean, name: string) => {
        const newHidden = currentStatus; // Active -> Hidden=true

        try {
            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, { hidden: newHidden });
            alert(`Account di ${name} ${newHidden ? 'DISABILITATO' : 'RIABILITATO'}.`);
            loadUsers();
        } catch (e: any) {
            alert(`Errore cambio stato: ${e.message}`);
        }
    };

    const handleRename = async (docId: string, currentName: string) => {
        const newName = prompt('Nuovo nome per il manager:', currentName);
        if (!newName || newName === currentName) return;

        try {
            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, {
                manager_name: newName,
            });
            loadUsers();
        } catch (e: any) {
            alert(`Errore rinomina: ${e.message}`);
        }
    };

    const handleUpdateBudget = async (docId: string, currentBudget: number, name: string) => {
        const input = prompt(`Modifica Budget per ${name}:`, currentBudget.toString());
        if (input === null) return;

        const newBudget = parseInt(input);
        if (isNaN(newBudget)) {
            alert('Inserisci un numero valido.');
            return;
        }

        try {
            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, {
                credits_remaining: newBudget,
            });
            loadUsers();
        } catch (e: any) {
            alert(`Errore aggiornamento budget: ${e.message}`);
        }
    };

    return {
        users,
        loading,
        searchTerm,
        setSearchTerm,
        sortConfig,
        handleSort,
        getSortedUsers,
        handleCreateUser,
        handleDelete,
        handleResetPassword,
        handleUpdateRole,
        handleToggleStatus,
        handleRename,
        handleUpdateBudget,
        GHOST_ADMIN_ID
    };
};
