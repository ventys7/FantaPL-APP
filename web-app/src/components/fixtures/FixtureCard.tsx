import { Fixture } from '../../hooks/useFixtures';
import { getMobileShortName, getDesktopName } from '../../utils/teams';

interface FixtureCardProps {
    match: Fixture;
    onClick: (match: Fixture) => void;
}

export function FixtureCard({ match, onClick }: FixtureCardProps) {
    const renderMatchStatus = (match: Fixture) => {
        if (match.status === 'FINISHED') {
            return (
                <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                    <span className="font-bold text-white text-lg">{match.homeScore} - {match.awayScore}</span>
                    <div className="text-[10px] text-gray-400 font-mono text-center">FT</div>
                </div>
            );
        }
        if (match.status === 'IN_PLAY') {
            return (
                <div className="bg-pl-pink/20 px-3 py-1 rounded-lg border border-pl-pink/30 animate-pulse-slow flex flex-col items-center min-w-[70px]">
                    <span className="font-bold text-pl-pink text-lg leading-none">{match.homeScore} - {match.awayScore}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-pl-pink animate-pulse" />
                        <span className="text-[10px] text-pl-pink font-bold tracking-wider">
                            {match.minute || 'LIVE'}
                        </span>
                    </div>
                </div>
            );
        }
        // Scheduled
        const time = new Date(match.date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        return (
            <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 min-w-[60px] flex items-center justify-center">
                <span className="text-gray-300 font-mono text-sm">{time}</span>
            </div>
        );
    };

    return (
        <div
            onClick={() => onClick(match)}
            className="cursor-pointer"
        >
            <div className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 flex items-center justify-between transition-all group mb-2 mx-1 relative overflow-hidden">
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                {/* Home Team */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate text-right w-full hidden sm:block">
                        {getDesktopName(match.home.shortName)}
                    </span>
                    <span className="text-sm font-semibold text-white truncate text-right w-full sm:hidden">
                        {getMobileShortName(match.home.name, match.home.shortName)}
                    </span>
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10">
                        <img src={match.home.logo} alt="" className="w-full h-full object-contain" />
                    </div>
                </div>

                {/* Score / Status / Date */}
                <div className="mx-3 shrink-0 flex flex-col items-center gap-1">
                    {renderMatchStatus(match)}
                    <span className="text-[10px] text-gray-500 font-mono uppercase">
                        {new Date(match.date).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </span>
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center p-1.5 shrink-0 border border-white/10">
                        <img src={match.away.logo} alt="" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-semibold text-white truncate text-left w-full hidden sm:block">
                        {getDesktopName(match.away.shortName)}
                    </span>
                    <span className="text-sm font-semibold text-white truncate text-left w-full sm:hidden">
                        {getMobileShortName(match.away.name, match.away.shortName)}
                    </span>
                </div>
            </div>
        </div>
    );
}
