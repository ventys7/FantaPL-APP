import { ChevronUp, ChevronDown, Coins, Lock, Unlock, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { User, UserRole } from '../../../types/shared';

interface ParticipantDesktopTableProps {
    users: User[];
    currentUser: any;
    sortConfig: { key: string; direction: string };
    onSort: (key: any) => void;
    onUpdateBudget: (docId: string, current: number, name: string) => void;
    onUpdateRole: (docId: string, role: UserRole, name: string) => void;
    onToggleStatus: (docId: string, status: boolean, name: string) => void;
    onRename: (docId: string, name: string) => void;
    onResetPassword: (docId: string, name: string, userId: string) => void;
    onDelete: (docId: string, name: string) => void;
    ghostAdminId: string;
}

export const ParticipantDesktopTable = ({
    users, currentUser, sortConfig, onSort,
    onUpdateBudget, onUpdateRole, onToggleStatus, onRename, onResetPassword, onDelete,
    ghostAdminId
}: ParticipantDesktopTableProps) => {

    const SortIcon = ({ colKey }: { colKey: string }) => {
        if (sortConfig.key !== colKey) return <div className="w-3 h-3 opacity-0" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-pl-teal" /> : <ChevronDown size={14} className="text-pl-teal" />;
    };

    return (
        <div className="hidden md:block bg-[#16161a] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left">
                <thead className="bg-black/20 text-gray-500 uppercase text-xs font-bold tracking-wider">
                    <tr>
                        <th className="p-5 cursor-pointer hover:text-white transition group select-none w-auto" onClick={() => onSort('name')}>
                            <div className="flex items-center gap-2">Manager <SortIcon colKey="name" /></div>
                        </th>
                        <th className="p-5 cursor-pointer hover:text-white transition group select-none w-40" onClick={() => onSort('role')}>
                            <div className="flex items-center gap-2">Ruolo <SortIcon colKey="role" /></div>
                        </th>
                        <th className="p-5 text-right w-48">Azioni</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.map(u => (
                        <tr key={u.$id} className={`hover:bg-white/[0.02] transition group ${!u.status ? 'opacity-50' : ''}`}>
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    {/* Status Dot */}
                                    <div
                                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${u.status ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}
                                        title={u.status ? 'Attivo' : 'Sospeso'}
                                    />

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white text-base">{u.name}</span>
                                            {/* Budget Badge - Hidden for Ghost Admin */}
                                            {u.$id !== ghostAdminId && (
                                                <button
                                                    onClick={() => onUpdateBudget(u.prefs.teamId!, (u as any).credits, u.name)}
                                                    className="text-xs bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-pl-teal font-mono flex items-center gap-1 transition"
                                                    title="Modifica Budget"
                                                >
                                                    <Coins size={10} />
                                                    {((u as any).credits)} cr
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-600 font-mono hidden group-hover:block transition-opacity select-all">{u.$id}</span>
                                    </div>
                                    {u.prefs?.teamId === currentUser?.prefs?.teamId && <span className="px-2 py-0.5 bg-pl-teal/10 text-pl-teal text-[10px] font-bold uppercase rounded ml-2">Tu</span>}
                                </div>
                            </td>
                            <td className="p-5">
                                <select
                                    value={u.prefs.role}
                                    onChange={(e) => onUpdateRole(u.prefs.teamId!, e.target.value as UserRole, u.name)}
                                    disabled={u.prefs.role === 'g_admin' && currentUser?.$id !== u.$id}
                                    className={`bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-white/20 hover:bg-white/5 transition cursor-pointer ${u.prefs.role === 'g_admin' ? 'text-pl-teal font-extrabold cursor-not-allowed opacity-70' : 'text-gray-300 focus:text-white'}`}
                                >
                                    <option value="user">Utente</option>
                                    <option value="helper">Helper</option>
                                    <option value="admin">Admin</option>
                                    {currentUser?.prefs?.role === 'g_admin' && <option value="g_admin">Ghost Admin</option>}
                                </select>
                            </td>
                            <td className="p-5">
                                <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onToggleStatus(u.prefs.teamId!, u.status, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition" title={u.status ? "Disabilita" : "Abilita"}>
                                        {u.status ? <Lock size={18} /> : <Unlock size={18} />}
                                    </button>
                                    <button onClick={() => onRename(u.prefs.teamId!, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-yellow-400 transition" title="Rinomina">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => onResetPassword(u.prefs.teamId!, u.name, u.$id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400 transition" title="Reset Password">
                                        <RefreshCw size={18} />
                                    </button>
                                    <button onClick={() => onDelete(u.prefs.teamId!, u.name)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition" title="Elimina">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
