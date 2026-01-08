import { useState, useEffect, useMemo } from 'react';
import { databases, DB_ID, COLL_PLAYERS, COLL_TEAMS } from '../lib/appwrite';
import { logger } from '../lib/logger';
import { Query } from 'appwrite';
import { Player, RealTeam } from '../types/player';

// Re-export for backward compatibility
export type { Player, RealTeam } from '../types/player';


interface UsePlayersReturn {
    players: Player[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    teams: string[];
    owners: string[];
    realTeams: RealTeam[]; // New export
}

export function usePlayers(): UsePlayersReturn {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            // First fetch all teams to get short_name mapping
            const teamsResponse = await databases.listDocuments(DB_ID, COLL_TEAMS, [
                Query.limit(100)
            ]);

            const teamMap = new Map<string, string>();
            const realTeamsList: RealTeam[] = []; // Collect full objects

            teamsResponse.documents.forEach(doc => {
                const teamData = {
                    $id: doc.$id,
                    name: doc.name,
                    short_name: doc.short_name,
                    goalkeeper_owner: doc.goalkeeper_owner,
                    goalkeeper_quotation: doc.goalkeeper_quotation,
                    goalkeeper_purchase_price: doc.goalkeeper_purchase_price
                };
                teamMap.set(doc.$id, doc.short_name || doc.name);
                realTeamsList.push(teamData);
            });
            setRealTeams(realTeamsList); // Update realTeams state

            // Fetch all players (paginated if needed)
            let allPlayers: Player[] = [];
            let offset = 0;
            const limit = 100;
            let hasMore = true;

            while (hasMore) {
                const response = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                    Query.limit(limit),
                    Query.offset(offset),
                    Query.orderAsc('name')
                ]);

                const batch = response.documents.map(doc => ({
                    $id: doc.$id,
                    fotmob_id: doc.fotmob_id,
                    name: doc.name,
                    team_id: doc.team_id,
                    team_name: doc.team_name,
                    team_short_name: teamMap.get(doc.team_id) || doc.team_name,
                    position: doc.position,
                    image_url: doc.image_url,
                    quotation: doc.quotation || 0,
                    purchase_price: doc.purchase_price || 0,
                    owner: doc.owner || null,
                    is_active: doc.is_active !== false, // Default to true if missing
                    created_at: doc.$createdAt
                })) as Player[];

                allPlayers = [...allPlayers, ...batch];
                offset += limit;
                hasMore = response.documents.length === limit;
            }

            setPlayers(allPlayers);
        } catch (err: any) {
            logger.error('[usePlayers] Error fetching players:', err);
            setError(err.message || 'Errore nel caricamento giocatori');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, []);

    // Extract unique teams (using short names)
    const teams = useMemo(() => {
        const teamSet = new Set(players.map(p => p.team_short_name));
        return Array.from(teamSet).sort();
    }, [players]);

    // Extract unique owners
    const owners = useMemo(() => {
        const ownerSet = new Set(players.map(p => p.owner || 'Svincolato'));
        return Array.from(ownerSet).sort();
    }, [players]);

    // Expose realTeams via state or ref? Ideally state.
    const [realTeams, setRealTeams] = useState<RealTeam[]>([]);

    return {
        players,
        loading,
        error,
        refresh: fetchPlayers,
        teams,
        owners,
        realTeams
    };
}
