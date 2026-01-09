import { Coins, Lock, Unlock, Edit2, RefreshCw, Trash2 } from 'lucide-react';
import { User, UserRole } from '../../../types/shared';

interface ParticipantMobileListProps {
    users: User[];
    currentUser: any;
    onUpdateBudget: (docId: string, current: number, name: string) => void;
    onUpdateRole: (docId: string, role: UserRole, name: string) => void;
    onToggleStatus: (docId: string, status: boolean, name: string) => void;
    onRename: (docId: string, name: string) => void;
    onResetPassword: (docId: string, name: string, userId: string) => void;
    onDelete: (docId: string, name: string) => void;
    ghostAdminId: string;
}

export const ParticipantMobileList = ({
    users, currentUser,
    onUpdateBudget, onUpdateRole, onToggleStatus, onRename, onResetPassword, onDelete,
    ghostAdminId
}: ParticipantMobileListProps) => {
    return (
        <div className="md:hidden space-y-4">
            {users.map(u => (
                <div key={u.$id} className={`bg-[#16161a] border border-white/5 rounded-xl p-5 shadow-lg relative overflow-hidden ${!u.status ? 'opacity-60' : ''}`}>
                    {/* Status Bar */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${u.status ? 'bg-emerald-500' : 'bg-red-500'}`} />

                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div className="flex gap-3 items-center">
                            {/* Status Dot Mobile */}
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${u.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-lg text-white leading-tight">{u.name}</div>
                                    {/* Budget Badge Mobile - Hidden for Ghost Admin */}
                                    {u.$id !== ghostAdminId && (
                                        <button
                                            onClick={() => onUpdateBudget(u.prefs.teamId!, (u as any).credits, u.name)}
                                            className="text-[10px] bg-white/10 hover:bg-white/20 px-1.5 py-0.5 rounded text-pl-teal font-mono flex items-center gap-1 transition"
                                        >
                                            <Coins size={10} />
                                            {((u as any).credits)} cr
                                        </button>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-600 font-mono mt-0.5">{u.$id}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onToggleStatus(u.prefs.teamId!, u.status, u.name)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                                {u.status ? <Lock size={16} /> : <Unlock size={16} />}
                            </button>
                            <button onClick={() => onRename(u.prefs.teamId!, u.name)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-yellow-400">
                                <Edit2 size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-4 pl-2 border-t border-white/5 pt-4">
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold block mb-1">Ruolo</label>
                            <select
                                value={u.prefs.role}
                                onChange={(e) => onUpdateRole(u.prefs.teamId!, e.target.value as UserRole, u.name)}
                                className="bg-black/30 border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 w-full"
                            >
                                <option value="user">Utente</option>
                                <option value="helper">Helper</option>
                                <option value="admin">Admin</option>
                                {currentUser?.prefs?.role === 'g_admin' && <option value="g_admin">Ghost Admin</option>}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pl-2 pt-2 border-t border-white/5">
                        <button onClick={() => onResetPassword(u.prefs.teamId!, u.name, u.$id)} className="flex-1 py-2 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 flex items-center justify-center gap-2">
                            <RefreshCw size={14} /> Password
                        </button>
                        <button onClick={() => onDelete(u.prefs.teamId!, u.name)} className="flex-1 py-2 text-xs font-medium bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 flex items-center justify-center gap-2">
                            <Trash2 size={14} /> Elimina
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
