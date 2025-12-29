import React from 'react';
import { User, Shield, Zap, RefreshCw } from 'lucide-react';

export const Dashboard = () => {
    // MOCK DATA for "Paolo's Team"
    const team = {
        name: "Real Madrink",
        manager: "Paolo",
        credits: 12,
        score: 74.5,
        opponent: "Atletico Ma Non Troppo",
        opponentScore: 68.0
    };

    const lineup = [
        { role: 'GK', name: 'Liverpool Block', team: 'LIV', vote: 6.5, bonus: 0, status: 'played' },
        { role: 'DEF', name: 'G. Magalhaes', team: 'ARS', vote: 7.0, bonus: 3, status: 'played' }, // Goal
        { role: 'DEF', name: 'P. Porro', team: 'TOT', vote: 6.0, bonus: -0.5, status: 'played' },
        { role: 'DEF', name: 'R. Lewis', team: 'MCI', vote: 0, bonus: 0, status: 'not-played', switch: 's_base' }, // Didn't play
        { role: 'MID', name: 'C. Palmer', team: 'CHE', vote: 8.0, bonus: 4, status: 'played' }, // Goal + Assist
        { role: 'MID', name: 'B. Saka', team: 'ARS', vote: 7.5, bonus: 1, status: 'played' },
        { role: 'MID', name: 'L. Diaz', team: 'LIV', vote: 6.5, bonus: 0, status: 'played' },
        { role: 'MID', name: 'B. Fernandes', team: 'MUN', vote: 5.5, bonus: -0.5, status: 'live' },
        { role: 'ATT', name: 'E. Haaland', team: 'MCI', vote: 9.0, bonus: 6, status: 'played' }, // 2 Goals
        { role: 'ATT', name: 'A. Isak', team: 'NEW', vote: 6.0, bonus: 0, status: 'played' },
        { role: 'ATT', name: 'N. Jackson', team: 'CHE', vote: 6.5, bonus: 0, status: 'played' }
    ];

    const bench = [
        { role: 'DEF', name: 'K. Trippier', team: 'NEW', vote: 6.0, bonus: 0, switchTarget: 'R. Lewis' },
        { role: 'MID', name: 'Mainoo', team: 'MUN', vote: 0, bonus: 0 },
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-pl-card p-6 rounded-xl border border-pl-purple shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-10"><Shield size={64} className="text-pl-green" /></div>
                    <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest">My Team</h2>
                    <div className="text-2xl font-black text-white mt-1">{team.name}</div>
                    <div className="text-pl-green font-bold text-sm mt-1">{team.manager}</div>
                </div>

                <div className="bg-gradient-to-br from-pl-card to-pl-purple/30 p-6 rounded-xl border border-gray-700 shadow-lg text-center relative">
                    <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Live Score</div>
                    <div className="flex items-center justify-center space-x-6">
                        <div>
                            <div className="text-4xl font-black text-white">{team.score}</div>
                            <div className="text-xs text-gray-400 mt-1">Paolo</div>
                        </div>
                        <div className="text-2xl text-gray-600 font-bold">VS</div>
                        <div>
                            <div className="text-4xl font-black text-gray-400">{team.opponentScore}</div>
                            <div className="text-xs text-gray-500 mt-1">Opponent</div>
                        </div>
                    </div>
                    <div className="mt-3 inline-block bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded animate-pulse">
                        MATCH IN PROGRESS
                    </div>
                </div>

                <div className="bg-pl-card p-6 rounded-xl border border-gray-700 shadow-lg">
                    <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest">Next Opponent</h2>
                    <div className="text-xl font-bold text-white mt-2">Daje Biglino FC</div>
                    <div className="text-gray-500 text-sm mt-1">GW 4 - Anfield</div>
                </div>
            </div>

            {/* PITCH VIEW */}
            <div className="bg-pl-dark border border-gray-700 rounded-xl overflow-hidden shadow-2xl relative">
                {/* Pitch lines css effect could go here */}
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent)] bg-[length:50px_50px]"></div>

                <div className="p-6 relative z-10">
                    <h3 className="text-center text-white font-bold mb-6 tracking-[0.2em] opacity-80">STARTING XI</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {lineup.map((player, i) => (
                            <div key={i} className="bg-pl-card/90 backdrop-blur border border-white/10 p-3 rounded-lg flex items-center justify-between group hover:border-pl-green transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${player.role === 'GK' ? 'bg-yellow-500/80 text-black' :
                                            player.role === 'DEF' ? 'bg-blue-500/80 text-white' :
                                                player.role === 'MID' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
                                        }`}>
                                        {player.role}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-white group-hover:text-pl-green transition-colors">{player.name}</div>
                                        <div className="text-xs text-gray-400">{player.team}</div>

                                        {/* Switch Indicator */}
                                        {player.switch === 's_base' && (
                                            <div className="flex items-center gap-1 text-[10px] text-pl-blue mt-1">
                                                <RefreshCw size={10} />
                                                <span>Switch Active (Trippier entering)</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    {player.status === 'not-played' ? (
                                        <span className="text-gray-500 text-xs font-bold">DNP</span>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-white">{(player.vote + player.bonus).toFixed(1)}</span>
                                            {player.bonus !== 0 && (
                                                <span className={`text-xs font-bold ${player.bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {player.bonus > 0 ? '+' : ''}{player.bonus}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
