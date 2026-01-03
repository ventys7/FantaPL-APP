import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, FileText, ChevronLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
    const navigate = useNavigate();
    const { hasRole } = useAuth();

    return (
        <div className="flex flex-col md:flex-row min-h-full bg-pl-dark">
            {/* Sidebar / Tabs */}
            <div className="w-full md:w-64 bg-black/20 border-b md:border-b-0 md:border-r border-white/10 flex flex-row md:flex-col overflow-x-auto">
                <div className="p-4 border-r md:border-r-0 md:border-b border-white/10 md:mb-2 flex items-center gap-2">
                    <button onClick={() => navigate('/dashboard')} className="p-1 hover:bg-white/10 rounded text-gray-400">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-white">Admin Panel</span>
                </div>

                <nav className="flex-1 flex flex-row md:flex-col p-2 gap-1">
                    {hasRole('admin') && (
                        <NavLink
                            to="/admin/participants"
                            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-pl-teal/20 text-pl-teal border border-pl-teal/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users size={20} />
                            Partecipanti
                        </NavLink>
                    )}
                    <NavLink
                        to="/admin/votes"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-pl-pink/20 text-pl-pink border border-pl-pink/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FileText size={20} />
                        Voti
                    </NavLink>
                    <NavLink
                        to="/admin/system"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-pl-teal/20 text-pl-teal border border-pl-teal/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <RefreshCw size={20} />
                        System Sync
                    </NavLink>
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gradient-to-br from-pl-dark via-pl-purple/10 to-pl-dark overflow-y-auto h-[calc(100vh-64px)]">
                <Outlet />
            </div>
        </div>
    );
}
