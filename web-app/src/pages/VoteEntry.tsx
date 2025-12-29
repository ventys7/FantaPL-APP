import React, { useState, useEffect } from 'react';
import { VotingService, PlayerPerformance } from '../services/votingService';
import { Save, User, Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

// Simple types for the UI
interface Player {
    id: string;
    name: string;
    role: string;
    real_team_id: string;
}

interface Fixture {
    id: string;
    home_team: { id: string; name: string };
    away_team: { id: string; name: string };
}

// Helper to calculate score on the fly (Preview)
const calculatePreviewScore = (p: PlayerPerformance) => {
    let score = p.vote_base || 0;
    if (!p.vote_base) return 0;

    score += (p.goals_scored * 3);
    score += (p.assists * 1);
    score -= (p.yellow_cards * 0.5);
    score -= (p.red_cards * 1);
    score += (p.penalties_scored * 3);
    score -= (p.penalties_missed * 3);
    score += (p.penalties_saved * 3); // for GK
    score -= (p.own_goals * 2);
    if (p.clean_sheet) score += 2;

    return score;
};

export const VoteEntry = () => {
    // Mock data/state for now since we might not have DB connected
    const [fixture, setFixture] = useState<Fixture | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [performances, setPerformances] = useState<Record<string, PlayerPerformance>>({});

    const handleValueChange = (playerId: string, field: keyof PlayerPerformance, value: any) => {
        setPerformances(prev => ({
            ...prev,
            [playerId]: {
                ...prev[playerId],
                [field]: value
            }
        }));
    };

    const increment = (playerId: string, field: keyof PlayerPerformance) => {
        const current = (performances[playerId] as any)?.[field] || 0;
        handleValueChange(playerId, field, current + 1);
    };

    const decrement = (playerId: string, field: keyof PlayerPerformance) => {
        const current = (performances[playerId] as any)?.[field] || 0;
        if (current > 0) handleValueChange(playerId, field, current - 1);
    };

    // Render a Single Player Row
    const renderRow = (player: Player) => {
        const perf = performances[player.id] || {
            player_id: player.id, vote_base: 0, goals_scored: 0, assists: 0,
            yellow_cards: 0, red_cards: 0, penalties_scored: 0, penalties_missed: 0,
            penalties_saved: 0, own_goals: 0, clean_sheet: false, minutes_played: 90
        };

        const total = calculatePreviewScore(perf);

        return (
            <div key={player.id} className="grid grid-cols-12 gap-2 items-center bg-pl-dark/40 border-b border-gray-700 p-2 hover:bg-gray-800/50 transition-colors">
                {/* Name & Role */}
                <div className="col-span-3 flex items-center space-x-2">
                    <span className={clsx(
                        "text-xs font-bold px-1.5 py-0.5 rounded",
                        {
                            'bg-yellow-500/20 text-yellow-500': player.role === 'GK',
                            'bg-blue-500/20 text-blue-500': player.role === 'DEF',
                            'bg-green-500/20 text-green-500': player.role === 'MID',
                            'bg-red-500/20 text-red-500': player.role === 'ATT'
                        }
                    )}>{player.role}</span>
                    <span className="text-sm font-medium text-white truncate">{player.name}</span>
                </div>

                {/* Base Vote */}
                <div className="col-span-1">
                    <input
                        type="number" step="0.5" min="1" max="10"
                        className="w-full bg-gray-900 border border-gray-600 rounded px-1 py-1 text-center text-white font-bold focus:border-pl-blue outline-none"
                        placeholder="-"
                        value={perf.vote_base || ''}
                        onChange={(e) => handleValueChange(player.id, 'vote_base', parseFloat(e.target.value))}
                    />
                </div>

                {/* Bonuses (Counters) */}
                <div className="col-span-6 flex items-center space-x-3 text-xs">
                    {/* Goals */}
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 mb-1">GOL</span>
                        <div className="flex items-center space-x-1">
                            <button tabIndex={-1} onClick={() => decrement(player.id, 'goals_scored')} className="hover:text-red-400"><Minus size={14} /></button>
                            <span className={clsx("font-bold w-4 text-center", perf.goals_scored > 0 ? "text-pl-green" : "text-gray-600")}>{perf.goals_scored}</span>
                            <button tabIndex={-1} onClick={() => increment(player.id, 'goals_scored')} className="hover:text-green-400"><Plus size={14} /></button>
                        </div>
                    </div>

                    {/* Assists */}
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 mb-1">AST</span>
                        <div className="flex items-center space-x-1">
                            <button tabIndex={-1} onClick={() => decrement(player.id, 'assists')} className="hover:text-red-400"><Minus size={14} /></button>
                            <span className={clsx("font-bold w-4 text-center", perf.assists > 0 ? "text-pl-blue" : "text-gray-600")}>{perf.assists}</span>
                            <button tabIndex={-1} onClick={() => increment(player.id, 'assists')} className="hover:text-green-400"><Plus size={14} /></button>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col items-center">
                        <span className="text-gray-500 mb-1">AM/ES</span>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => handleValueChange(player.id, 'yellow_cards', perf.yellow_cards ? 0 : 1)}
                                className={clsx("w-5 h-6 rounded flex items-center justify-center border", perf.yellow_cards ? "bg-yellow-500 border-yellow-600 text-black" : "bg-transparent border-gray-600")}
                            >Y</button>
                            <button
                                onClick={() => handleValueChange(player.id, 'red_cards', perf.red_cards ? 0 : 1)}
                                className={clsx("w-5 h-6 rounded flex items-center justify-center border", perf.red_cards ? "bg-red-500 border-red-600 text-white" : "bg-transparent border-gray-600")}
                            >R</button>
                        </div>
                    </div>

                    {/* Clean Sheet */}
                    {(player.role === 'GK' || player.role === 'DEF') && (
                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 mb-1">CS</span>
                            <input
                                type="checkbox"
                                checked={perf.clean_sheet}
                                onChange={(e) => handleValueChange(player.id, 'clean_sheet', e.target.checked)}
                                className="w-4 h-4 accent-pl-green"
                            />
                        </div>
                    )}
                </div>

                {/* Total Score Preview */}
                <div className="col-span-2 text-right">
                    <div className="text-xxs text-gray-500 uppercase tracking-wider">TOT</div>
                    <div className={clsx("text-xl font-black", total >= 6 ? "text-pl-green" : "text-gray-400")}>
                        {total.toFixed(1)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Match Data Entry</h1>
                    <p className="text-gray-400 text-sm">Input votes and events manually.</p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-pl-green text-pl-dark font-bold rounded-lg hover:bg-white transition-colors shadow-[0_0_15px_rgba(0,255,133,0.3)]">
                    <Save size={18} />
                    <span>Save Match Data</span>
                </button>
            </div>

            {/* Mock Selection for now */}
            <div className="mb-6 p-4 bg-pl-card rounded-lg border border-gray-700">
                <select className="bg-pl-dark text-white p-2 rounded border border-gray-600 w-full md:w-1/3">
                    <option>Select a Fixture...</option>
                    <option>Liverpool vs Arsenal</option>
                </select>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Home Team Column */}
                <div className="space-y-1">
                    <h3 className="text-pl-pink font-bold uppercase tracking-widest text-sm mb-2 pl-2">Liverpool (Home)</h3>
                    <div className="bg-pl-card rounded-lg border border-gray-700 overflow-hidden">
                        {/* Mock Players */}
                        {[{ id: '1', name: 'Salah', role: 'ATT', real_team_id: 'LIV' }, { id: '2', name: 'Van Dijk', role: 'DEF', real_team_id: 'LIV' }].map(renderRow)}
                    </div>
                </div>

                {/* Away Team Column */}
                <div className="space-y-1">
                    <h3 className="text-pl-blue font-bold uppercase tracking-widest text-sm mb-2 pl-2">Arsenal (Away)</h3>
                    <div className="bg-pl-card rounded-lg border border-gray-700 overflow-hidden">
                        {/* Mock Players */}
                        {[{ id: '3', name: 'Saka', role: 'ATT', real_team_id: 'ARS' }, { id: '4', name: 'Raya', role: 'GK', real_team_id: 'ARS' }].map(renderRow)}
                    </div>
                </div>
            </div>
        </div>
    );
};
