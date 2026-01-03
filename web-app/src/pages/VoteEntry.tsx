import { Save } from 'lucide-react';
import { useVotes } from '../hooks/useVotes';
import { PlayerVoteRow } from '../components/votes/PlayerVoteRow';

// Mock types until we connect real DB fully
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

export const VoteEntry = () => {
    const {
        handleValueChange,
        increment,
        decrement,
        getPerformance,
        calculatePreviewScore
    } = useVotes();

    const homePlayers: Player[] = [
        { id: '1', name: 'Salah', role: 'ATT', real_team_id: 'LIV' },
        { id: '2', name: 'Van Dijk', role: 'DEF', real_team_id: 'LIV' }
    ];

    const awayPlayers: Player[] = [
        { id: '3', name: 'Saka', role: 'ATT', real_team_id: 'ARS' },
        { id: '4', name: 'Raya', role: 'GK', real_team_id: 'ARS' }
    ];

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
                        {homePlayers.map(player => (
                            <PlayerVoteRow
                                key={player.id}
                                player={player}
                                performance={getPerformance(player.id)}
                                onValueChange={handleValueChange}
                                onIncrement={increment}
                                onDecrement={decrement}
                                totalScore={calculatePreviewScore(getPerformance(player.id))}
                            />
                        ))}
                    </div>
                </div>

                {/* Away Team Column */}
                <div className="space-y-1">
                    <h3 className="text-pl-blue font-bold uppercase tracking-widest text-sm mb-2 pl-2">Arsenal (Away)</h3>
                    <div className="bg-pl-card rounded-lg border border-gray-700 overflow-hidden">
                        {awayPlayers.map(player => (
                            <PlayerVoteRow
                                key={player.id}
                                player={player}
                                performance={getPerformance(player.id)}
                                onValueChange={handleValueChange}
                                onIncrement={increment}
                                onDecrement={decrement}
                                totalScore={calculatePreviewScore(getPerformance(player.id))}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
