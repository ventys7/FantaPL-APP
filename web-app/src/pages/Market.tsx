import React, { useState } from 'react';
import { Search, Gavel, DollarSign, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

// Mock Data
const MOCK_FREE_AGENTS = [
    { id: '1', name: 'Chiesa', role: 'MID', team: 'LIV', price: 12, status: 'free' },
    { id: '2', name: 'Calafiori', role: 'DEF', team: 'ARS', price: 8, status: 'free' },
    { id: '3', name: 'Zirkzee', role: 'ATT', team: 'MUN', price: 25, status: 'auction' },
    { id: '4', name: 'Tonali', role: 'MID', team: 'NEW', price: 15, status: 'free' },
];

export const Market = () => {
    const [credits, setCredits] = useState(340); // Starting Mock Credits
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPlayers = MOCK_FREE_AGENTS.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Demo Banner */}
            <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-200 p-3 rounded-lg flex items-center mb-6">
                <AlertTriangle size={18} className="mr-2" />
                <span className="text-sm">Demo Mode: Database not connected. Transactions will not be saved.</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Transfer Market</h1>
                    <p className="text-gray-400">Acquire free agents or bid in auctions.</p>
                </div>

                <div className="bg-pl-card px-6 py-3 rounded-xl border border-pl-green/30 shadow-lg flex items-center space-x-3">
                    <div className="p-2 bg-pl-green/20 rounded-full text-pl-green">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 font-bold uppercase">Budget</div>
                        <div className="text-2xl font-black text-white">{credits} <span className="text-sm text-gray-500">Cr</span></div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-500" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-4 border border-gray-700 rounded-xl leading-5 bg-pl-card text-white placeholder-gray-500 focus:outline-none focus:border-pl-green focus:ring-1 focus:ring-pl-green sm:text-sm transition-colors"
                    placeholder="Search player by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Player List */}
            <div className="bg-pl-card border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 bg-pl-dark/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1">Role</div>
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2">Team</div>
                    <div className="col-span-2 text-center">Quot.</div>
                    <div className="col-span-3 text-right">Action</div>
                </div>

                {filteredPlayers.map((player) => (
                    <div key={player.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 items-center hover:bg-pl-dark/30 transition-colors">
                        <div className="col-span-1">
                            <span className={clsx(
                                "text-xs font-bold px-2 py-1 rounded",
                                {
                                    'bg-yellow-500/20 text-yellow-500': player.role === 'GK',
                                    'bg-blue-500/20 text-blue-500': player.role === 'DEF',
                                    'bg-green-500/20 text-green-500': player.role === 'MID',
                                    'bg-red-500/20 text-red-500': player.role === 'ATT'
                                }
                            )}>{player.role}</span>
                        </div>

                        <div className="col-span-4 font-bold text-white text-lg">{player.name}</div>
                        <div className="col-span-2 text-gray-400 text-sm">{player.team}</div>

                        <div className="col-span-2 text-center font-mono font-bold text-pl-blue">{player.price}</div>

                        <div className="col-span-3 text-right">
                            {player.status === 'auction' ? (
                                <button className="px-4 py-2 bg-pl-pink text-white rounded-lg font-bold text-sm hover:bg-pl-pink/80 transition flex items-center justify-end ml-auto gap-2">
                                    <Gavel size={16} /> Bid
                                </button>
                            ) : (
                                <button className="px-4 py-2 bg-pl-green text-pl-dark rounded-lg font-bold text-sm hover:bg-white transition">
                                    Purchase
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredPlayers.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No players found matching '{searchTerm}'</div>
                )}
            </div>
        </div>
    );
};
