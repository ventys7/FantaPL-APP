import { useState } from 'react';
import { UserRole } from '../../../types/shared';
import { User, X, UserPlus } from 'lucide-react';

interface ParticipantFormProps {
    isCreating: boolean;
    setIsCreating: (val: boolean) => void;
    onCreate: (name: string, username: string, password: string, role: UserRole) => Promise<boolean>;
    currentUserRole: string | undefined;
}

export const ParticipantForm = ({ isCreating, setIsCreating, onCreate, currentUserRole }: ParticipantFormProps) => {
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('user');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await onCreate(newName, newUsername, newPassword, newRole);
        if (success) {
            setIsCreating(false);
            setNewName('');
            setNewUsername('');
            setNewPassword('');
        }
    };

    if (!isCreating) return null;

    return (
        <div className="bg-[#1e1e24] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/5 pb-4">Nuovo Profilo</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        {currentUserRole === 'g_admin' && <option value="g_admin">Ghost Admin</option>}
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
    );
};
