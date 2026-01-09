import { useState } from 'react';
import { Shield, UserPlus, Users, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useParticipantManager } from '../hooks/useParticipantManager';
import { ParticipantForm, ParticipantDesktopTable, ParticipantMobileList } from '../components/admin/participants';

export function ParticipantManagement() {
    const { user: currentUser } = useAuth();
    const [isCreating, setIsCreating] = useState(false);

    const {
        users: sortedUsers, // The hook returns sorted users when calling getSortedUsers, but let's check hook structure.
        // Wait, the hook returns `getSortedUsers`, not `users` directly sorted.
        // Let's check useParticipantManager structure I just wrote.
        // It returns { users, getSortedUsers, ... }.
        // I need to call getSortedUsers() to get the list to display.
        getSortedUsers,
        searchTerm,
        setSearchTerm,
        sortConfig,
        handleSort,
        handleCreateUser,
        handleDelete,
        handleResetPassword,
        handleUpdateRole,
        handleToggleStatus,
        handleRename,
        handleUpdateBudget,
        GHOST_ADMIN_ID
    } = useParticipantManager(currentUser);

    const displayUsers = getSortedUsers();

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
            {currentUser?.prefs?.role === 'g_admin' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl text-xs md:text-sm text-yellow-200/80">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-yellow-200"><Shield size={14} /> Note Admin</h4>
                    <ul className="list-disc list-inside space-y-1 opacity-80">
                        <li><strong>Eliminazione:</strong> Rimuove solo i dati FantaPL. Rimuovere l'utente Auth manualmente dalla Console.</li>
                    </ul>
                </div>
            )}

            {/* Create User Form */}
            <ParticipantForm
                isCreating={isCreating}
                setIsCreating={setIsCreating}
                onCreate={handleCreateUser}
                currentUserRole={currentUser?.prefs?.role}
            />

            {/* Desktop Table */}
            <ParticipantDesktopTable
                users={displayUsers}
                currentUser={currentUser}
                sortConfig={sortConfig}
                onSort={handleSort}
                onUpdateBudget={handleUpdateBudget}
                onUpdateRole={handleUpdateRole}
                onToggleStatus={handleToggleStatus}
                onRename={handleRename}
                onResetPassword={handleResetPassword}
                onDelete={handleDelete}
                ghostAdminId={GHOST_ADMIN_ID}
            />

            {/* Mobile Cards */}
            <ParticipantMobileList
                users={displayUsers}
                currentUser={currentUser}
                onUpdateBudget={handleUpdateBudget}
                onUpdateRole={handleUpdateRole}
                onToggleStatus={handleToggleStatus}
                onRename={handleRename}
                onResetPassword={handleResetPassword}
                onDelete={handleDelete}
                ghostAdminId={GHOST_ADMIN_ID}
            />
        </div>
    );
}
