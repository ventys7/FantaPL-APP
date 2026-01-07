import { useState, useEffect } from 'react';
import { databases, storage, DB_ID, COLL_FANTASY_TEAMS, BUCKET_LOGOS } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { ID } from 'appwrite';

interface DashboardTeam {
    id: string;
    name: string;
    manager: string;
    credits: number;
    score: number;
    opponent: string;
    opponentScore: number;
    logoUrl?: string;
}

interface LineupPlayer {
    role: string;
    name: string;
    team: string;
    vote: number;
    bonus: number;
    status: 'played' | 'not-played' | 'live';
}

export const useDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<DashboardTeam | null>(null);

    // Mock lineup for now
    const [lineup] = useState<LineupPlayer[]>([
        { role: 'GK', name: 'Liverpool Block', team: 'LIV', vote: 6.5, bonus: 0, status: 'played' },
        { role: 'DEF', name: 'G. Magalhaes', team: 'ARS', vote: 7.0, bonus: 3, status: 'played' },
        { role: 'DEF', name: 'P. Porro', team: 'TOT', vote: 6.0, bonus: -0.5, status: 'played' },
        { role: 'DEF', name: 'R. Lewis', team: 'MCI', vote: 0, bonus: 0, status: 'not-played' },
        { role: 'MID', name: 'C. Palmer', team: 'CHE', vote: 8.0, bonus: 4, status: 'played' },
        { role: 'MID', name: 'B. Fernandes', team: 'MUN', vote: 5.5, bonus: -0.5, status: 'live' },
        { role: 'ATT', name: 'E. Haaland', team: 'MCI', vote: 9.0, bonus: 6, status: 'played' }
    ]);

    useEffect(() => {
        if (user?.prefs?.teamId) {
            fetchTeamData(user.prefs.teamId);
        } else {
            setLoading(false);
        }
    }, [user?.prefs?.teamId]);

    const fetchTeamData = async (teamId: string) => {
        try {
            setLoading(true);
            const doc = await databases.getDocument(DB_ID, COLL_FANTASY_TEAMS, teamId);

            setTeam({
                id: doc.$id,
                name: doc.team_name,
                manager: doc.manager_name,
                credits: doc.credits_remaining,
                logoUrl: doc.fantasylogo_url,
                // Placeholders
                score: 0,
                opponent: "Prossimo Avversario",
                opponentScore: 0
            });
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTeamDetails = async (newName: string, logo?: File | string) => {
        if (!team?.id) return;

        try {
            let logoUrl = team.logoUrl;

            if (logo) {
                if (typeof logo === 'string') {
                    // Direct URL provided
                    logoUrl = logo;
                } else {
                    // File upload
                    const file = await storage.createFile(BUCKET_LOGOS, ID.unique(), logo);
                    // Get View URL
                    const result = storage.getFileView(BUCKET_LOGOS, file.$id);
                    logoUrl = result.href;
                }
            }

            await databases.updateDocument(DB_ID, COLL_FANTASY_TEAMS, team.id, {
                team_name: newName,
                fantasylogo_url: logoUrl
            });

            // Update local state
            setTeam(prev => prev ? { ...prev, name: newName, logoUrl } : null);

        } catch (error) {
            console.error('Error updating team:', error);
            throw error;
        }
    };

    return {
        team: team || { // Fallback for no team found (e.g. admin without team)
            id: '',
            name: 'Nessuna Squadra',
            manager: user?.name || 'Manager',
            credits: 0,
            score: 0,
            opponent: '-',
            opponentScore: 0
        },
        lineup,
        loading,
        updateTeamDetails
    };
};
