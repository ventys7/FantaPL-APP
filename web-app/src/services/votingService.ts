import { databases, DB_ID, COLL_FIXTURES, COLL_TEAMS, COLL_PLAYERS, COLL_PERFORMANCES } from '../lib/appwrite';
import { Query, ID } from 'appwrite';

export interface PlayerPerformance {
    player_id: string;
    vote_base: number;
    goals_scored: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    penalties_scored: number;
    penalties_missed: number;
    penalties_saved: number;
    own_goals: number;
    clean_sheet: boolean;
    minutes_played: number;
}

export const VotingService = {
    // Fetch fixtures for a specific gameweek
    async getFixtures(gameweekId: number) {
        const response = await databases.listDocuments(DB_ID, COLL_FIXTURES, [
            Query.equal('gameweek', gameweekId)
        ]);
        return response.documents;
    },

    // Fetch players for the two teams in a fixture
    async getFixturePlayers(homeTeamId: string, awayTeamId: string) {
        // In Appwrite we might need multiple queries or a specialized index
        // For simplicity, fetching all players for these teams
        const response = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
            Query.equal('real_team_id', [homeTeamId, awayTeamId]),
            Query.limit(100)
        ]);
        return response.documents;
    },

    // Send the payload to save/update
    async savePerformances(fixtureId: string, performances: PlayerPerformance[]) {
        const promises = performances.map(async (p) => {
            // Check if exists
            const existing = await databases.listDocuments(DB_ID, COLL_PERFORMANCES, [
                Query.equal('fixture_id', fixtureId),
                Query.equal('player_id', p.player_id)
            ]);

            const data = {
                fixture_id: fixtureId,
                player_id: p.player_id,
                vote_base: p.vote_base,
                goals: p.goals_scored,
                assists: p.assists,
                yellow_cards: p.yellow_cards,
                red_cards: p.red_cards,
                pen_scored: p.penalties_scored,
                clean_sheet: p.clean_sheet
            };

            if (existing.documents.length > 0) {
                // Update
                return databases.updateDocument(DB_ID, COLL_PERFORMANCES, existing.documents[0].$id, data);
            } else {
                // Create
                return databases.createDocument(DB_ID, COLL_PERFORMANCES, ID.unique(), data);
            }
        });

        await Promise.all(promises);
    }
};
