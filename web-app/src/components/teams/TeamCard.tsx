import { useState } from 'react';
import { Shield, Coins, AlertCircle } from 'lucide-react';
import { SquadRoleSection } from './SquadRoleSection';

export interface TeamSquad {
    managerName: string;
    teamName: string;
    logoUrl?: string;
    budget: number;
    spent: number;
    remaining: number;
    players: any[];
    isComplete: boolean;
    roleCounts: { P: number; D: number; C: number; A: number };
    totalPlayers: number;
    teamId: string;
}

interface TeamCardProps {
    team: TeamSquad;
    realTeams: any[];
}

export const TeamCard = ({ team, realTeams }: TeamCardProps) => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'P' | 'D' | 'C' | 'A'>('ALL');

    const toggleFilter = (role: 'P' | 'D' | 'C' | 'A') => {
        setActiveFilter(prev => prev === role ? 'ALL' : role);
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group">
            {/* Card Header */}
            <div className="p-5 bg-gradient-to-r from-white/5 to-transparent border-b border-white/5">
                <div className="flex items-center gap-4 mb-4">
                    {/* Logo/Avatar */}
                    <div className="w-16 h-16 rounded-full bg-pl-teal/10 border-2 border-pl-teal/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-pl-teal">{team.managerName.charAt(0)}</span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-white truncate" title={team.teamName}>{team.teamName}</h3>
                        <div className="text-sm text-gray-400 font-medium">Allenatore: <span className="text-gray-200">{team.managerName}</span></div>
                    </div>
                </div>

                {/* Budget & Status Row */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Budget</span>
                        <div className="flex items-center gap-1.5 text-pl-teal font-mono font-bold text-lg">
                            <Coins size={16} />
                            {team.remaining} <span className="text-xs text-gray-500 font-normal self-end mb-0.5">/ {team.budget}</span>
                        </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${team.isComplete
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        {team.isComplete ? <Shield size={12} /> : <AlertCircle size={12} />}
                        {team.isComplete ? 'ROSA COMPLETA' : 'INCOMPLETA'}
                    </div>
                </div>
            </div>

            {/* Squad Breakdown (Clickable Filters) */}
            <div className="p-4 bg-black/20 text-xs text-gray-400 grid grid-cols-4 gap-2 text-center border-b border-white/5">
                <button
                    onClick={() => toggleFilter('P')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'P' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.P === 2 ? 'text-green-400 font-bold' : ''}`}
                >
                    P: {team.roleCounts.P}/2
                </button>
                <button
                    onClick={() => toggleFilter('D')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'D' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.D === 8 ? 'text-green-400 font-bold' : ''}`}
                >
                    D: {team.roleCounts.D}/8
                </button>
                <button
                    onClick={() => toggleFilter('C')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'C' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.C === 8 ? 'text-green-400 font-bold' : ''}`}
                >
                    C: {team.roleCounts.C}/8
                </button>
                <button
                    onClick={() => toggleFilter('A')}
                    className={`transition-colors py-1 rounded hover:bg-white/5 ${activeFilter === 'A' ? 'bg-white/10 ring-1 ring-white/20' : ''} ${team.roleCounts.A === 6 ? 'text-green-400 font-bold' : ''}`}
                >
                    A: {team.roleCounts.A}/6
                </button>
            </div>

            {/* Detailed Roster */}
            <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5 bg-black/10 transition-all">
                {/* Conditionally Render Sections based on activeFilter */}
                {(activeFilter === 'ALL' || activeFilter === 'P') && (
                    <SquadRoleSection players={team.players} role="Portiere" label="Portieri" required={2} countType="block" realTeams={realTeams} managerName={team.managerName} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'D') && (
                    <SquadRoleSection players={team.players} role="Difensore" label="Difensori" required={8} realTeams={realTeams} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'C') && (
                    <SquadRoleSection players={team.players} role="Centrocampista" label="Centrocampisti" required={8} realTeams={realTeams} />
                )}
                {(activeFilter === 'ALL' || activeFilter === 'A') && (
                    <SquadRoleSection players={team.players} role="Attaccante" label="Attaccanti" required={6} realTeams={realTeams} />
                )}
            </div>
        </div>
    );
};
