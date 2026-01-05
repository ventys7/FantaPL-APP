import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, Shield, FileText, LogIn, LogOut, ChevronDown, Menu, X, ClipboardList, Shirt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
    const { user, logout, hasRole } = useAuth();
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <nav className="bg-pl-purple border-b border-pl-green/30 px-4 py-3 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-2 group">
                    <div className="p-2 bg-pl-green rounded-full group-hover:bg-white transition-colors">
                        <Trophy className="w-5 h-5 text-pl-purple" />
                    </div>
                    <span className="text-xl font-bold font-sans tracking-tight text-white group-hover:text-pl-green transition-colors">
                        Fanta<span className="text-pl-green group-hover:text-white">PL</span>
                    </span>
                </Link>

                <div className="flex items-center space-x-6">
                    {/* Desktop Navigation - hidden on mobile */}
                    {user && (
                        <Link to="/dashboard" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                            <Shirt size={20} />
                            <span className="text-xs mt-1">La Mia Squadra</span>
                        </Link>
                    )}

                    <Link to="/players" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                        <ClipboardList size={20} />
                        <span className="text-xs mt-1">Listone</span>
                    </Link>

                    <Link to="/fixtures" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                        <Calendar size={20} />
                        <span className="text-xs mt-1">Calendario</span>
                    </Link>

                    <Link to="/rules" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                        <Shield size={20} />
                        <span className="text-xs mt-1">Regolamento</span>
                    </Link>

                    {/* Mobile Hamburger Menu - visible only on mobile */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Admin Access - Direct Link */}
                    {user && hasRole('helper') && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-pl-pink/20 hover:bg-pl-pink/30 transition text-white"
                        >
                            <Shield size={18} />
                            <span className="text-sm hidden md:inline">Admin Panel</span>
                        </Link>
                    )}

                    {/* Login/Logout Button */}
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition text-white"
                        >
                            <LogOut size={18} />
                            <span className="text-sm hidden md:inline">Logout</span>
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pl-teal/20 hover:bg-pl-teal/30 transition text-white"
                        >
                            <LogIn size={18} />
                            <span className="text-sm hidden md:inline">Accesso</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute left-0 right-0 top-16 bg-pl-dark/98 backdrop-blur-lg border-b border-white/20 shadow-xl">
                    <div className="flex flex-col">
                        {user && (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-6 py-4 text-gray-300 hover:text-white hover:bg-white/10 transition border-b border-white/10"
                                onClick={closeMobileMenu}
                            >
                                <Shirt size={20} />
                                <span>La Mia Squadra</span>
                            </Link>
                        )}
                        <Link
                            to="/players"
                            className="flex items-center gap-3 px-6 py-4 text-gray-300 hover:text-white hover:bg-white/10 transition border-b border-white/10"
                            onClick={closeMobileMenu}
                        >
                            <ClipboardList size={20} />
                            <span>Listone</span>
                        </Link>
                        <Link
                            to="/fixtures"
                            className="flex items-center gap-3 px-6 py-4 text-gray-300 hover:text-white hover:bg-white/10 transition border-b border-white/10"
                            onClick={closeMobileMenu}
                        >
                            <Calendar size={20} />
                            <span>Calendario</span>
                        </Link>
                        <Link
                            to="/rules"
                            className="flex items-center gap-3 px-6 py-4 text-gray-300 hover:text-white hover:bg-white/10 transition"
                            onClick={closeMobileMenu}
                        >
                            <Shield size={20} />
                            <span>Regolamento</span>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
