import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Settings, Shield, Users, FileText, DollarSign } from 'lucide-react';

export const Navbar = () => {
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
                    <Link to="/dashboard" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                        <Users size={20} />
                        <span className="text-xs mt-1">My Team</span>
                    </Link>

                    <Link to="/market" className="hidden md:flex flex-col items-center text-gray-300 hover:text-white transition cursor-pointer">
                        <DollarSign size={20} />
                        <span className="text-xs mt-1">Market</span>
                    </Link>

                    <Link to="/admin/votes" className="flex flex-col items-center text-gray-300 hover:text-pl-blue transition cursor-pointer">
                        <FileText size={20} />
                        <span className="text-xs mt-1">Votes</span>
                    </Link>

                    <Link to="/admin/rules" className="flex flex-col items-center text-gray-300 hover:text-pl-green transition cursor-pointer">
                        <Shield size={20} />
                        <span className="text-xs mt-1">Rules</span>
                    </Link>
                </div>
            </div>
        </nav>
    );
};
