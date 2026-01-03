import { Client, Databases, ID, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Appwrite API Key
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

// API-Football Configuration
const API_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';
const LEAGUE_ID = 39; // Premier League
const SEASON = 2025; // Change dynamically if needed

// Appwrite Helper
const getClient = () => {
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// --- LOGIC: Sync Fixtures ---
async function syncFixtures(db) {
    console.log('Fetching fixtures from API-Football...');

    try {
        const response = await axios.get(`${API_BASE_URL}/fixtures`, {
            headers: {
                'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
                'x-rapidapi-key': RAPIDAPI_KEY
            },
            params: {
                league: LEAGUE_ID,
                season: SEASON
            }
        });

        const matches = response.data.response;
        console.log(`Found ${matches.length} matches.`);

        let processed = 0;
        let errors = 0;

        for (const match of matches) {
            const docId = `pl_${match.fixture.id}`; // Custom ID strategy

            const fixtureData = {
                external_id: match.fixture.id,
                gameweek: parseInt(match.league.round.replace(/[^0-9]/g, '')) || 0,
                home_team_id: `team_${match.teams.home.id}`, // Assumption: SyncTeams run before
                away_team_id: `team_${match.teams.away.id}`,
                date: match.fixture.date,
                status: match.fixture.status.short, // NS, FT, LIVE, etc.
                home_score: match.goals.home,
                away_score: match.goals.away,
                minute: match.fixture.status.elapsed,
                season: match.league.season
            };

            try {
                // Upsert logic: Try to update, if fail then create
                // Note: Direct create with custom ID is cleaner if we assume ID stability
                await db.updateDocument(
                    DATABASE_ID,
                    FIXTURES_COLLECTION_ID,
                    docId,
                    fixtureData
                );
                // console.log(`Updated fixture ${docId}`);
            } catch (err) {
                if (err.code === 404) {
                    try {
                        await db.createDocument(
                            DATABASE_ID,
                            FIXTURES_COLLECTION_ID,
                            docId,
                            fixtureData
                        );
                        // console.log(`Created fixture ${docId}`);
                    } catch (createErr) {
                        console.error(`Failed to create fixture ${docId}:`, createErr.message);
                        errors++;
                    }
                } else {
                    console.error(`Failed to update fixture ${docId}:`, err.message);
                    errors++;
                }
            }
            processed++;
        }

        return { success: true, processed, errors };
    } catch (error) {
        console.error('API Error:', error.message);
        throw error;
    }
}

// --- MAIN HANDLER ---
export default async ({ req, res, log, error }) => {
    // Check Request Method (POST only)
    if (req.method !== 'POST') {
        return res.json({ success: false, error: 'Method not allowed' }, 405);
    }

    // Parse Body
    let body = {};
    try {
        body = req.body ? JSON.parse(req.body) : {};
    } catch (e) {
        body = req.body || {};
    }

    const action = body.action || 'SYNC_FIXTURES'; // Default action

    if (!RAPIDAPI_KEY) {
        error('RAPIDAPI_KEY is missing in env vars');
        return res.json({ success: false, error: 'Configuration Error' }, 500);
    }

    const db = getClient();

    try {
        let result;
        switch (action) {
            case 'SYNC_FIXTURES':
                result = await syncFixtures(db);
                break;
            default:
                return res.json({ success: false, error: 'Unknown Action' }, 400);
        }

        return res.json(result);
    } catch (err) {
        error(err.message);
        return res.json({ success: false, error: err.message }, 500);
    }
};
