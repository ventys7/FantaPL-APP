import { Fixture, Team } from '../../../types/shared';
import { MatchEvent } from '../../../types/matchsheet';

interface MatchScoreboardProps {
    fixture: Fixture;
    homeTeam: Team | undefined;
    awayTeam: Team | undefined;
    events: MatchEvent[];
    renderGoalScorer: (e: MatchEvent, i: number) => React.ReactNode;
}

export function MatchScoreboard({ fixture, homeTeam, awayTeam, events, renderGoalScorer }: MatchScoreboardProps) {
    return (
        <div className="flex flex-col bg-gradient-to-r from-[#37003c] to-[#1f0029] border-b border-white/10 shrink-0">
            <div className="flex items-start justify-between p-6 md:p-3 md:pb-3">
                {/* Home Team & Goals */}
                <div className="flex flex-col items-center justify-start w-1/3">
                    {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                    <span className="font-bold text-white text-center leading-tight mb-2 min-h-[2.5em] flex items-center justify-center">{homeTeam?.name}</span>
                    <div className="flex flex-col items-center gap-1 w-full">
                        {events
                            ?.filter(e => (e.isHome || e.team?.name === homeTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                            .map(renderGoalScorer)}
                    </div>
                </div>

                {/* Result & Status */}
                <div className="flex flex-col items-center pt-4 w-1/3">
                    <div className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tighter text-center">
                        {fixture.home_score ?? 0} - {fixture.away_score ?? 0}
                    </div>
                    <div className="mt-2 px-3 py-1 bg-white/10 rounded text-xs font-bold text-pl-teal uppercase tracking-widest text-center">
                        {fixture.status === 'IN_PLAY' || fixture.status === 'PAUSED' ? `${fixture.minute}'` : fixture.status}
                    </div>
                </div>

                {/* Away Team & Goals */}
                <div className="flex flex-col items-center justify-start w-1/3">
                    {awayTeam?.logo_url && <img src={awayTeam.logo_url} className="w-16 h-16 md:w-20 md:h-20 object-contain mb-2" />}
                    <span className="font-bold text-white text-center leading-tight mb-2 min-h-[2.5em] flex items-center justify-center">{awayTeam?.name}</span>
                    <div className="flex flex-col items-center gap-1 w-full">
                        {events
                            ?.filter(e => (!e.isHome && e.team?.name !== homeTeam?.name || e.team?.name === awayTeam?.name) && (e.type === 'Goal' || e.type === 'OwnGoal'))
                            .map(renderGoalScorer)}
                    </div>
                </div>
            </div>
        </div>
    );
}
