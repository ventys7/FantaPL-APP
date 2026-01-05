import { useState, useEffect } from 'react';
import { account, databases, functions, COLL_FANTASY_TEAMS, DB_ID } from '../lib/appwrite';
import { ID, Query, ExecutionMethod } from 'appwrite';
import { User, UserRole } from '../types/shared';
import { Trash2, Edit2, Shield, UserPlus, Users, RefreshCw, Lock, Unlock, ChevronUp, ChevronDown, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type SortKey = 'name' | 'role';
type SortDirection = 'asc' | 'desc';

export function ParticipantManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    const GHOST_ADMIN_ID = '695842e1003a3db19fea';

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

            // Filter Ghost Admin: Visible ONLY to himself
            const filteredUsers = mappedUsers.filter(u =>
                u.$id !== GHOST_ADMIN_ID || currentUser?.$id === GHOST_ADMIN_ID
            );

            setUsers(filteredUsers);
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
        let sorted = [...users];

        // Filter by Search Term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            sorted = sorted.filter(u => u.name.toLowerCase().includes(term));
        }

        sorted.sort((a, b) => {
            // 1. PRIMARY SORT: Status (Active First, Inactive/Disabled LAST)
            // If statuses are different, prioritize Active (status=true)
            if (a.status !== b.status) {
                return a.status ? -1 : 1;
            }

            // 2. SECONDARY SORT: Selected Key (Name/Role)
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

    const SortIcon = ({ colKey }: { colKey: SortKey }) => {
        if (sortConfig.key !== colKey) return <div className="w-3 h-3 opacity-0" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-pl-teal" /> : <ChevronDown size={14} className="text-pl-teal" />;
    };

    const sortedUsers = getSortedUsers();

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">

            {/* Header */}
            <div className="flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
                        <Users className="text-pl-teal w-8 h-8" />
                        Partecipanti
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Gestisci gli utenti e i loro permessi.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cerca manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-3 md:py-2 text-sm text-white focus:outline-none focus:border-pl-teal/50 w-full transition"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreating(prev => !prev)}
                        className={`w-full md:w-auto font-bold px-6 py-3 md:py-2 rounded-lg transition shadow-lg flex items-center justify-center gap-2 whitespace-nowrap text-sm ${isCreating ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-pl-teal text-pl-dark hover:bg-pl-teal/90 shadow-pl-teal/20'}`}
                    >
                        {isCreating ? <X size={18} /> : <UserPlus size={18} />}
                        {isCreating ? 'Chiudi' : 'Nuovo Utente'}
                    </button>
                </div>
            </div>

            {/* Admin Note Box */}
            {currentUser?.name?.toLowerCase() === 'admin' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-xs md:text-sm text-yellow-200/80">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-yellow-200"><Shield size={14} /> Note Admin</h4>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li><strong>Reset Password:</strong> Forza il reset al prossimo login. Non cambia la password Auth se l'utente l'ha scordata (Eliminare e Ricreare).</li>
                        <li><strong>Eliminazione:</strong> Rimuove solo i dati FantaPL. Rimuovere l'utente Auth manualmente dalla Console.</li>
                    </ul>
                </div>
            )}

            {/* Create User Form */}
            {isCreating && (
                <div className="bg-[#1e1e24] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Nuovo Profilo</h3>
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-bold uppercase">Nome Manager</label>
                            <input
                                type="text"
                                placeholder="Es. Paolo"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-pl-teal/50 focus:bg-black/40 transition outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-bold uppercase">Username</label>
                            <input
                                type="text"
                                placeholder="Es. paolo"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-pl-teal/50 focus:bg-black/40 transition outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-bold uppercase">Password Temp</label>
                            <input
                                type="password"
                                placeholder="Es. pippo123"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-pl-teal/50 focus:bg-black/40 transition outline-none"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-bold uppercase">Ruolo</label>
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value as UserRole)}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-pl-teal/50 focus:bg-black/40 transition outline-none appearance-none"
                            >
                                <option value="user">Utente</option>
                                <option value="helper">Helper</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                            <button
                                type="submit"
                                className="bg-pl-teal hover:bg-pl-teal/90 text-pl-dark px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-pl-teal/20 transition w-full md:w-auto"
                            >
                                Crea Utente
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block bg-[#16161a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-gray-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="p-5 cursor-pointer hover:text-white transition group select-none w-auto" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">Manager <SortIcon colKey="name" /></div>
                            </th>
                            <th className="p-5 cursor-pointer hover:text-white transition group select-none w-40" onClick={() => handleSort('role')}>
                                <div className="flex items-center gap-2">Ruolo <SortIcon colKey="role" /></div>
                            </th>
                            {/* REMOVED STATUS COLUMN HEADER */}
                            <th className="p-5 text-right w-48">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedUsers.map(u => (
                            <tr key={u.$id} className={`hover:bg-white/[0.02] transition group ${!u.status ? 'opacity-50' : ''}`}>
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        {/* Status Dot */}
                                        <div
                                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${u.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                                            title={u.status ? 'Attivo' : 'Sospeso'}
                                        />

                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-base">{u.name}</span>
                                            <span className="text-xs text-gray-600 font-mono hidden group-hover:block transition-opacity select-all">{u.$id}</span>
                                        </div>
                                        {u.prefs?.teamId === currentUser?.prefs?.teamId && <span className="px-2 py-0.5 bg-pl-teal/10 text-pl-teal text-[10px] font-bold uppercase rounded ml-2">Tu</span>}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <select
                                        value={u.prefs.role}
                                        onChange={(e) => handleUpdateRole(u.prefs.teamId!, e.target.value as UserRole, u.name)}
                                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:text-white outline-none focus:border-white/20 hover:bg-white/5 transition cursor-pointer"
                                    >
                                        <option value="user">Utente</option>
                                        <option value="helper">Helper</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                {/* REMOVED STATUS COLUMN CELL */}
                                <td className="p-5">
                                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleToggleStatus(u.prefs.teamId!, u.status, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition" title={u.status ? "Disabilita" : "Abilita"}>
                                            {u.status ? <Lock size={18} /> : <Unlock size={18} />}
                                        </button>
                                        <button onClick={() => handleRename(u.prefs.teamId!, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-yellow-400 transition" title="Rinomina">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleResetPassword(u.prefs.teamId!, u.name, u.$id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition" title="Reset Password">
                                            <RefreshCw size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(u.prefs.teamId!, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition" title="Elimina">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {sortedUsers.map(u => (
                    <div key={u.$id} className={`bg-[#16161a] border border-white/5 rounded-xl p-5 shadow-lg relative overflow-hidden ${!u.status ? 'opacity-60' : ''}`}>
                        {/* Status Bar */}
                        <div className={`absolute top-0 left-0 w-1 h-full ${u.status ? 'bg-emerald-500' : 'bg-red-500'}`} />

                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div className="flex gap-3 items-center">
                                {/* Status Dot Mobile */}
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${u.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <div>
                                    <div className="font-bold text-lg text-white leading-tight">{u.name}</div>
                                    <div className="text-[10px] text-gray-600 font-mono mt-0.5">{u.$id}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleStatus(u.prefs.teamId!, u.status, u.name)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                                    {u.status ? <Lock size={16} /> : <Unlock size={16} />}
                                </button>
                                <button onClick={() => handleRename(u.prefs.teamId!, u.name)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-yellow-400">
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 mb-4 pl-2 border-t border-white/5 pt-4">
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Ruolo</label>
                                <select
                                    value={u.prefs.role}
                                    onChange={(e) => handleUpdateRole(u.prefs.teamId!, e.target.value as UserRole, u.name)}
                                    className="bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 w-full"
                                >
                                    <option value="user">Utente</option>
                                    <option value="helper">Helper</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            {/* REMOVED STATUS TEXT BOX ON MOBILE too, inferred by Color/Dot */}
                        </div>

                        <div className="flex gap-2 justify-end pl-2 pt-2 border-t border-white/5">
                            <button onClick={() => handleResetPassword(u.prefs.teamId!, u.name, u.$id)} className="flex-1 py-2 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 flex items-center justify-center gap-2">
                                <RefreshCw size={14} /> Password
                            </button>
                            <button onClick={() => handleDelete(u.prefs.teamId!, u.name)} className="flex-1 py-2 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                                <Trash2 size={14} /> Elimina
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
