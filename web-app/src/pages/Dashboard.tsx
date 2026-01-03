import { useDashboard } from '../hooks/useDashboard';
import { TeamCard } from '../components/dashboard/TeamCard';
import { LiveScoreCard } from '../components/dashboard/LiveScoreCard';
import { NextOpponentCard } from '../components/dashboard/NextOpponentCard';
import { LineupTable } from '../components/dashboard/LineupTable';

export const Dashboard = () => {
    const { team, lineup, loading, updateTeamDetails } = useDashboard();

    if (loading) return <div className="min-h-screen bg-pl-dark flex items-center justify-center text-white">Caricamento...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-pl-dark via-pl-purple/20 to-pl-dark py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Profile Section */}
                <div className="grid grid-cols-1">
                    <TeamCard
                        teamName={team.name}
                        managerName={team.manager}
                        credits={team.credits}
                        logoUrl={team.logoUrl}
                        onUpdate={updateTeamDetails}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Live Score */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-pl-pink pl-3">Live Score</h3>
                        <LiveScoreCard myScore={team.score} opponentScore={team.opponentScore} />
                        <NextOpponentCard opponentName={team.opponent} />
                    </div>

                    {/* Right Column: Squad / Pitch */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-white uppercase tracking-wider border-l-4 border-pl-green pl-3">La Rosa</h3>
                        <LineupTable lineup={lineup} />
                    </div>
                </div>
            </div>
        </div>
    );
};
