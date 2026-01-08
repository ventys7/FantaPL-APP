import { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useAuth } from '../context/AuthContext';
import { databases, DB_ID, COLL_FANTASY_TEAMS } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { Loader2, Users } from 'lucide-react';
import { UserRole } from '../types/shared';
import { TeamCard, TeamSquad } from '../components/teams';
import { REQUIRED_COUNTS } from '../constants/players';

// Helper to normalize owner names (handling slight variations if needed)
const normalizeOwner = (name: string) => name?.trim() || 'Svincolato';

export const TeamsList = () => {
    const { players, loading: playersLoading, error, realTeams } = usePlayers();
    const { user } = useAuth();
    const [teamsAnalysis, setTeamsAnalysis] = useState<TeamSquad[]>([]);
    const [fantasyTeamData, setFantasyTeamData] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(true);

    // Fetch fantasy team metadata (for logos etc.)
    const fetchFantasyTeams = async () => {
        try {
            const response = await databases.listDocuments(DB_ID, COLL_FANTASY_TEAMS);
            const map = new Map<string, any>();
            response.documents.forEach(doc => {
                map.set(normalizeOwner(doc.manager_name), doc);
            });
            setFantasyTeamData(map);
        } catch (err) {
            logger.error('[TeamsList] Error fetching fantasy teams:', err);
        }
    };

    useEffect(() => {
        fetchFantasyTeams();
    }, []);

    // Group players by owner and calculate stats
    useEffect(() => {
        if (!players.length) return;

        const grouped = new Map<string, any[]>();

        players.forEach(p => {
            const owner = normalizeOwner(p.owner || '');
            if (owner === 'Svincolato') return;

            if (!grouped.has(owner)) grouped.set(owner, []);
            grouped.get(owner)!.push(p);
        });

        // Include GK blocks from realTeams
        realTeams.forEach(team => {
            const owner = normalizeOwner(team.goalkeeper_owner || '');
            if (owner && owner !== 'Svincolato') {
                // Get all GKs for this team
                const teamGKs = players.filter(p => p.team_id === team.$id && p.position === 'Portiere');
                if (teamGKs.length > 0 && !grouped.has(owner)) {
                    grouped.set(owner, []);
                }
                // Add GKs if not already added
                if (teamGKs.length > 0) {
                    const existingPlayerIds = new Set(grouped.get(owner)?.map(p => p.$id) || []);
                    teamGKs.forEach(gk => {
                        if (!existingPlayerIds.has(gk.$id)) {
                            grouped.get(owner)!.push({
                                ...gk,
                                quotation: team.goalkeeper_quotation || gk.quotation,
                                purchase_price: team.goalkeeper_purchase_price || 0
                            });
                        }
                    });
                }
            }
        });

        const analysis: TeamSquad[] = [];

        grouped.forEach((ownerPlayers, owner) => {
            // Calculate role counts (unique teams for P)
            const pCount = new Set(ownerPlayers.filter(p => p.position === 'Portiere').map(p => p.team_id)).size;
            const dCount = ownerPlayers.filter(p => p.position === 'Difensore').length;
            const cCount = ownerPlayers.filter(p => p.position === 'Centrocampista').length;
            const aCount = ownerPlayers.filter(p => p.position === 'Attaccante').length;

            // Get fantasy team data
            const ftData = fantasyTeamData.get(owner);

            // Calculate spent (sum of purchase_price)
            const spent = ownerPlayers.reduce((sum, p) => sum + (p.purchase_price || 0), 0);

            // Use credits_remaining directly from DB
            const remaining = ftData?.credits_remaining ?? 0;
            const budget = ftData?.budget ?? 500;

            analysis.push({
                managerName: owner,
                teamName: ftData?.team_name || `Team ${owner}`,
                logoUrl: ftData?.fantasylogo_url,
                budget,
                spent,
                remaining,
                players: ownerPlayers,
                isComplete: pCount === REQUIRED_COUNTS.P && dCount === REQUIRED_COUNTS.D && cCount === REQUIRED_COUNTS.C && aCount === REQUIRED_COUNTS.A,
                roleCounts: { P: pCount, D: dCount, C: cCount, A: aCount },
                totalPlayers: ownerPlayers.length,
                teamId: ftData?.$id
            });
        });

        // Custom Sorting: Compound names (with hyphens) go to the end, then alphabetical
        analysis.sort((a, b) => {
            const aHasHyphen = a.managerName.includes('-');
            const bHasHyphen = b.managerName.includes('-');

            if (aHasHyphen && !bHasHyphen) return 1;
            if (!aHasHyphen && bHasHyphen) return -1;
            return a.managerName.localeCompare(b.managerName);
        });

        // Filter out g_admin from the list (unless viewing as g_admin)
        const currentUserRole = (user?.prefs?.role as UserRole) || 'user';
        const filteredAnalysis = analysis.filter(team => {
            // Find the user's role for this manager
            const managerData = fantasyTeamData.get(team.managerName);
            const managerRole = managerData?.role as UserRole | undefined;
            // Hide g_admin from non-g_admin users
            if (managerRole === 'g_admin' && currentUserRole !== 'g_admin') {
                return false;
            }
            return true;
        });

        setTeamsAnalysis(filteredAnalysis);
        setLoading(false);
    }, [players, realTeams, fantasyTeamData, user]);

    if (playersLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-pl-teal" />
                <span className="text-gray-400">Caricamento rose...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-red-400">
                <p>Errore: {error}</p>
            </div>
        );
    }

    return (
        <div className="w-full px-4 md:px-12 lg:px-24 xl:px-32 container mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col items-center justify-center mb-8 mt-6 text-center">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                        <Users className="text-pl-teal" />
                        Rose Fantacalcio
                    </h1>
                    <p className="text-gray-400 mt-1">{teamsAnalysis.length} squadre registrate</p>
                </div>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {teamsAnalysis.map(team => (
                    <TeamCard key={team.managerName} team={team} realTeams={realTeams} />
                ))}
            </div>
        </div>
    );
};
