import { useState, useEffect } from 'react';
import { account, databases, functions, COLL_FANTASY_TEAMS, DB_ID } from '../lib/appwrite';
import { ID, Query, ExecutionMethod } from 'appwrite';
import { User, UserRole } from '../types/shared';
import { Trash2, Edit2, Shield, UserPlus, RefreshCw, Lock, Unlock, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type SortKey = 'name' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

export function ParticipantManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
        key: 'name',
        direction: 'asc'
    });

    // Form State
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('user');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS, [
                Query.limit(100)
            ]);

            const mappedUsers = response.documents.map(doc => ({
                $id: doc.user_id || doc.$id,
                name: doc.manager_name,
                email: 'N/A',
                status: !doc.hidden, // hidden=true means disabled/inactive
                prefs: {
                    role: doc.role as UserRole,
                    teamId: doc.$id
                }
            })) as unknown as User[];

            setUsers(mappedUsers);
        } catch (error) {
            console.error('Error loading participants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedUsers = () => {
        const sorted = [...users];
        sorted.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'role') {
                aValue = a.prefs.role || '';
                bValue = b.prefs.role || '';
            } else if (sortConfig.key === 'status') {
                aValue = a.status ? 1 : 0;
                bValue = b.status ? 1 : 0;
            } else {
                aValue = (a as any)[sortConfig.key];
                bValue = (b as any)[sortConfig.key];
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const email = `${newUsername.toLowerCase().replace(/\s+/g, '')}@fantapl.app`;
            const identity = await account.create(ID.unique(), email, newPassword, newName);

            await databases.createDocument(DB_ID, COLL_FANTASY_TEAMS, ID.unique(), {
                user_id: identity.$id,
                manager_name: newName,
                team_name: `Squadra di ${newName}`,
                credits_remaining: 500,
                role: newRole,
                hidden: false,
                force_pass_reset: true
            });

            alert(`Utente ${newName} creato con successo! Username: ${newUsername}`);
            setIsCreating(false);
            setNewName('');
            setNewUsername('');
            setNewPassword('');
            loadUsers();
        } catch (error: any) {
            console.error(error);
            if (error.code === 409) {
                alert('ERRORE: Questo Username o Email esiste già nel sistema Auth di Appwrite. Cambia username o elimina l\'utente dalla Console di Appwrite.');
            } else {
                alert(`Errore creazione: ${error.message}`);
            }
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
        if (!tempPassword) return; // Cancelled
        if (tempPassword.length < 8) {
            alert('La password deve essere di almeno 8 caratteri.');
            return;
        }

        if (!confirm(`Confermi di voler assegnare la password "${tempPassword}" a ${name}?`)) return;

        setLoading(true);
        try {
            // 1. Call Appwrite Cloud Function to update Auth Password (Server-side)
            // Replace 'admin-password-reset' with your actual Function ID from Appwrite Console
            // For now we use the name, but you should update this constant
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
                ExecutionMethod.POST // method - required for body
            );

            const result = JSON.parse(execution.responseBody);

            if (!result.success) {
                throw new Error(result.error);
            }

            // 2. Set 'force_pass_reset' flag in Database so they must change it again
            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, docId, {
                force_pass_reset: true
            });

            alert(`Password aggiornata correttamente! ${name} ora può accedere con "${tempPassword}" (e dovrà cambiarla al login).`);
        } catch (e: any) {
            console.error(e);
            alert(`Errore reset password (assicurati di aver deployato la Function): ${e.message}`);
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
        // currentStatus = true means Active (!hidden). Hidden = false.
        // We want to flip it. 
        // If Active -> Disable (hidden: true)
        // If Non Active -> Enable (hidden: false)
        const newHidden = currentStatus; // If currently active (status=true, hidden=false), new hidden should be true. Correct.

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

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortConfig.key !== colKey) return <div className="w-4 h-4 opacity-0" />; // Placeholder
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const sortedUsers = getSortedUsers();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Gestione Partecipanti</h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-pl-teal text-white px-4 py-2 rounded-lg hover:bg-pl-teal/80 transition"
                >
                    <UserPlus size={20} />
                    Nuovo Partecipante
                </button>
            </div>

            {/* Note on Limitations - Visible only to specific 'admin' user (case insensitive) */}
            {currentUser?.name?.toLowerCase() === 'admin' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg mb-6 text-sm text-yellow-200">
                    <h4 className="font-bold flex items-center gap-2 mb-1"><Shield size={16} /> Note Importanti per l'Admin</h4>
                    <ul className="list-disc list-inside space-y-1 opacity-90">
                        <li>
                            <strong>Reset Password:</strong> Imposta solo l'obbligo di cambio. Se l'utente ha <em>dimenticato</em> la password, devi <strong>Eliminare e Ricreare</strong> l'utente (limitazione di sicurezza).
                        </li>
                        <li>
                            <strong>Eliminazione:</strong> Rimuove solo il Profilo (Dati Fanta). Devi rimuovere manualmente l'account di Login (Auth) dalla Console Appwrite per riusare lo username.
                        </li>
                    </ul>
                </div>
            )}

            {isCreating && (
                <div className="bg-white/5 border border-white/20 rounded-xl p-6 mb-8 animate-fade-in">
                    <h3 className="text-xl font-bold text-white mb-4">Nuovo Utente</h3>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Nome Manager (es. Paolo)"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Username Login (es. paolo)"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password Provvisoria"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                            required
                        />
                        <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as UserRole)}
                            className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
                        >
                            <option value="user">Utente</option>
                            <option value="helper">Helper</option>
                            <option value="admin">Admin</option>
                        </select>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-300 hover:text-white"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="bg-green-500/20 text-green-400 border border-green-500/50 px-6 py-2 rounded-lg hover:bg-green-500/30"
                            >
                                Crea Utente
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white/5 border border-white/20 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-gray-400 uppercase text-sm">
                        <tr>
                            <th className="p-4 cursor-pointer hover:text-white transition flex items-center gap-1" onClick={() => handleSort('name')}>
                                Manager <SortIcon colKey="name" />
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('role')}>
                                <div className="flex items-center gap-1">Ruolo <SortIcon colKey="role" /></div>
                            </th>
                            <th className="p-4 cursor-pointer hover:text-white transition" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1">Stato <SortIcon colKey="status" /></div>
                            </th>
                            <th className="p-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {sortedUsers
                            .filter(u => u.name.toLowerCase() !== 'admin' || currentUser?.name?.toLowerCase() === 'admin')
                            .map(u => (
                                <tr key={u.$id} className="hover:bg-white/5 transition">
                                    <td className="p-4 font-medium text-white">
                                        <div className="flex flex-col">
                                            <span>{u.name}</span>
                                            <details className="text-xs text-gray-500 cursor-pointer select-none">
                                                <summary className="hover:text-gray-300 transition-colors">Mostra ID</summary>
                                                <span className="select-all font-mono bg-black/30 px-1 rounded">{u.$id}</span>
                                            </details>
                                        </div>
                                        {u.prefs?.teamId === currentUser?.prefs?.teamId && <span className="ml-2 text-xs text-pl-teal">(Tu)</span>}
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={u.prefs.role}
                                            onChange={(e) => handleUpdateRole(u.prefs.teamId!, e.target.value as UserRole, u.name)}
                                            className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-gray-300 focus:text-white"
                                        >
                                            <option value="user">Utente</option>
                                            <option value="helper">Helper</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${u.status ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            {u.status ? 'Attivo' : 'Non Attivo'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(u.prefs.teamId!, u.status, u.name)}
                                            className={`p-2 hover:bg-white/10 rounded-lg ${u.status ? 'text-orange-400' : 'text-green-400'}`}
                                            title={u.status ? "Disabilita Account" : "Riabilita Account"}
                                        >
                                            {u.status ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>

                                        <button
                                            onClick={() => handleRename(u.prefs.teamId!, u.name)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-yellow-400"
                                            title="Rinomina Manager"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u.prefs.teamId!, u.name, u.$id)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                                            title="Imposta Nuova Password Provvisoria"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.prefs.teamId!, u.name)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                            title="Elimina Profilo (Richiede anche delete Auth)"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
