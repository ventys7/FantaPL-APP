import { Shirt } from 'lucide-react';
import { PlayerRow } from '../PlayerRow';
import { TeamLineup, MatchEvent, FantasyPlayerData } from '../../../types/matchsheet';

interface MatchFormationProps {
    teamLineup: TeamLineup | null;
    getPlayerEvents: (id: number) => MatchEvent[] | null;
    calculateMinutesPlayed: (id: number, isBench: boolean) => number;
    getFantasyPlayerData: (id: number | string) => FantasyPlayerData;
}

export function MatchFormation({
    teamLineup, getPlayerEvents, calculateMinutesPlayed, getFantasyPlayerData
}: MatchFormationProps) {
    if (!teamLineup?.lineup) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400 italic">
                <Shirt className="w-8 h-8 mb-2 opacity-20" />
                Lineup not available
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="text-center text-xs font-bold bg-white/5 py-1 rounded mb-2">
                {teamLineup.formation || 'Unknown Formation'}
            </div>
            {/* Starters */}
            <div className="space-y-1">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Starters</h4>
                {teamLineup.lineup.map(p => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        isBench={false}
                        events={getPlayerEvents(p.id)}
                        minutesPlayed={calculateMinutesPlayed(p.id, false)}
                        fantasyData={getFantasyPlayerData(p.id)}
                    />
                ))}
            </div>
            {/* Bench */}
            <div className="space-y-1 mt-4">
                <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">Bench</h4>
                {teamLineup.bench.map(p => (
                    <PlayerRow
                        key={p.id}
                        player={p}
                        isBench={true}
                        events={getPlayerEvents(p.id)}
                        minutesPlayed={calculateMinutesPlayed(p.id, true)}
                        fantasyData={getFantasyPlayerData(p.id)}
                    />
                ))}
            </div>
        </div>
    );
}
