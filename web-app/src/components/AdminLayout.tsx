import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, FileText, ChevronLeft, RefreshCw, ClipboardList, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
    const navigate = useNavigate();
    const { hasRole, user } = useAuth();

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

                <nav className="flex-1 flex flex-row md:flex-col p-2 gap-2 md:gap-1">
                    {hasRole('admin') && (
                        <NavLink
                            to="/admin/participants"
                            className={({ isActive }) => `flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-pl-teal/20 text-pl-teal border border-pl-teal/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users size={20} className="md:w-5 md:h-5 w-6 h-6" />
                            <span className="text-[10px] md:text-base font-bold md:font-normal">Partecipanti</span>
                        </NavLink>
                    )}
                    {hasRole('admin') && (
                        <NavLink
                            to="/admin/players"
                            className={({ isActive }) => `flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ClipboardList size={20} className="md:w-5 md:h-5 w-6 h-6" />
                            <span className="text-[10px] md:text-base font-bold md:font-normal">Listone</span>
                        </NavLink>
                    )}
                    <NavLink
                        to="/admin/votes"
                        className={({ isActive }) => `flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-pl-pink/20 text-pl-pink border border-pl-pink/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <FileText size={20} className="md:w-5 md:h-5 w-6 h-6" />
                        <span className="text-[10px] md:text-base font-bold md:font-normal">Voti</span>
                    </NavLink>
                    {hasRole('admin') && (
                        <NavLink
                            to="/admin/trades"
                            className={({ isActive }) => `flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ArrowLeftRight size={20} className="md:w-5 md:h-5 w-6 h-6" />
                            <span className="text-[10px] md:text-base font-bold md:font-normal">Scambi</span>
                        </NavLink>
                    )}
                    {hasRole('g_admin') && (
                        <NavLink
                            to="/admin/system"
                            className={({ isActive }) => `flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg transition whitespace-nowrap ${isActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <RefreshCw size={20} className="md:w-5 md:h-5 w-6 h-6" />
                            <span className="text-[10px] md:text-base font-bold md:font-normal">Sistema</span>
                        </NavLink>
                    )}

                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gradient-to-br from-pl-dark via-pl-purple/10 to-pl-dark overflow-y-auto h-[calc(100vh-64px)]">
                <Outlet />
            </div>
        </div>
    );
}
