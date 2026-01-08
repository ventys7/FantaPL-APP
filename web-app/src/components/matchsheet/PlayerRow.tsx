import { Shirt } from 'lucide-react';
import { LineupPlayer, MatchEvent, FantasyPlayerData, getRoleStyle } from '../../types/matchsheet';

interface PlayerRowProps {
    player: LineupPlayer;
    isBench: boolean;
    events: MatchEvent[] | null;
    minutesPlayed: number;
    fantasyData: FantasyPlayerData;
}

/**
 * PlayerRow - Renders a single player in the lineup
 * Extracted from MatchSheet for better modularity
 */
export function PlayerRow({ player: p, isBench, events, minutesPlayed, fantasyData }: PlayerRowProps) {
    const fantasyRole = fantasyData.role || p.position;
    const fantasyOwner = fantasyData.owner;

    return (
        <div className={`flex items-center gap-3 ${isBench ? 'p-1.5' : 'p-2 bg-white/5'} rounded hover:bg-white/10 transition group`}>
            {/* Image & Number */}
            <div className="relative">
                {p.image ? (
                    <img
                        src={p.image}
                        alt={p.name}
                        className={`rounded-full object-cover bg-gray-800 ${isBench ? 'w-6 h-6' : 'w-8 h-8'}`}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                ) : (
                    <div className={`rounded-full bg-gray-800 flex items-center justify-center ${isBench ? 'w-6 h-6' : 'w-8 h-8'}`}>
                        <Shirt className="w-1/2 h-1/2 opacity-50" />
                    </div>
                )}
                <div className={`absolute -bottom-1 -right-1 bg-black/80 font-mono text-pl-teal text-[10px] px-1 rounded ${isBench ? 'text-[9px]' : ''}`}>
                    {p.number}
                </div>
            </div>

            {/* Name & Events */}
            <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`font-semibold truncate ${isBench ? 'text-gray-400 group-hover:text-white text-sm' : 'text-base'}`}>
                            {p.name}
                        </span>
                        {/* Inline Events Icons */}
                        {events?.map((e, i) => (
                            <EventIcon key={i} event={e} />
                        ))}
                    </div>

                    {/* Effective Minutes Badge */}
                    {minutesPlayed > 0 && (
                        <div
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${isBench
                                    ? 'bg-green-900/40 border-green-500/30 text-green-400'
                                    : 'bg-white/10 border-white/20 text-gray-300'
                                }`}
                            title={`Played ${minutesPlayed} minutes`}
                        >
                            {minutesPlayed}'
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <span className={`${isBench ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-wider ${getRoleStyle(fantasyRole)}`}>
                        {fantasyRole}
                    </span>
                    {fantasyOwner && (
                        <span
                            className={`font-semibold text-purple-300 opacity-80 ${isBench ? 'text-[8px]' : 'text-[10px]'}`}
                            title={`Proprietà di ${fantasyOwner}`}
                        >
                            • {fantasyOwner}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * EventIcon - Renders a single match event icon
 */
function EventIcon({ event: e }: { event: MatchEvent }) {
    const isGoal = e.type === 'Goal';
    const isOwnGoal = e.type === 'OwnGoal';
    const isYellow = e.type === 'Card' && e.detail === 'Yellow' && !e.secondYellow;
    const isSecondYellow = e.type === 'Card' && (e.secondYellow || e.detail === 'YellowRed');
    const isRed = e.type === 'Card' && e.detail === 'Red' && !e.secondYellow;
    const isSubIn = e.type === 'SubIn';
    const isSubOut = e.type === 'SubOut';
    const isAssist = e.type === 'Assist';
    const isPenaltyMissed = e.type === 'PenaltyMissed';
    const isPenaltySaved = e.type === 'PenaltySaved';

    return (
        <div title={`${e.type} (${e.time?.elapsed}')`} className="flex-shrink-0 flex items-center">
            {isGoal && <span className="text-xs">⚽</span>}
            {isOwnGoal && <span className="text-xs">⚽🔴</span>}
            {isYellow && <div className="w-2 h-3 bg-yellow-400 rounded-[1px]" />}
            {isSecondYellow && (
                <div className="flex">
                    <div className="w-2 h-3 bg-yellow-400 rounded-[1px]" />
                    <div className="w-2 h-3 bg-red-600 rounded-[1px] -ml-0.5" />
                </div>
            )}
            {isRed && <div className="w-2 h-3 bg-red-600 rounded-[1px]" />}
            {isSubIn && <span className="text-xs text-green-400">↑</span>}
            {isSubOut && <span className="text-xs text-red-400">↓</span>}
            {isAssist && <span className="text-xs text-blue-400">🅰️</span>}
            {isPenaltyMissed && <span className="text-xs">❌</span>}
            {isPenaltySaved && <span className="text-xs">🧤</span>}
        </div>
    );
}
