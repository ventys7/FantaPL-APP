import { Client, Databases, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Appwrite API Key
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';
const COLL_TEAMS = process.env.COLL_TEAMS || 'real_teams';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League
const TEAM_LOGO_BASE_URL = 'https://images.fotmob.com/image_resources/logo/teamlogo';

// Appwrite Helper
const getClient = () => {
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// --- HELPER: Appwrite Client Initialization ---
const apiClient = axios.create({
    baseURL: FOTMOB_BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fotmob.com/',
        'Accept': 'application/json, text/plain, */*'
    }
});

// --- HELPER: Fetch League Data ---
async function fetchLeagueData(log) {
    log('Fetching league data from FotMob...');
    const response = await apiClient.get('/leagues', {
        params: { id: FOTMOB_LEAGUE_ID, tab: 'matches' }
    });

    const data = response.data;

    // Normalize response structure
    let allMatches = [];
    if (data.fixtures && data.fixtures.allMatches) {
        allMatches = data.fixtures.allMatches;
    } else if (data.matches) {
        allMatches = Array.isArray(data.matches) ? data.matches : (data.matches.allMatches || []);
    } else if (data.allMatches) {
        allMatches = data.allMatches;
    }

    log(`Retrieved ${allMatches.length} matches from FotMob.`);
    return allMatches;
}

// --- LOGIC: Sync Teams ---
// We extract teams from the matches list to ensure IDs are consistent with fixtures
async function syncTeams(db, log, error) {
    try {
        const matches = await fetchLeagueData(log);
        const teamsMap = new Map();

        // Collect unique teams
        matches.forEach(m => {
            if (m.home) {
                teamsMap.set(m.home.id, { id: m.home.id, name: m.home.name });
            }
            if (m.away) {
                teamsMap.set(m.away.id, { id: m.away.id, name: m.away.name });
            }
        });

        log(`Found ${teamsMap.size} unique teams.`);

        // Manual Short Name Overrides (Optional, for better UI)
        const SHORT_NAMES = {
            'Wolverhampton Wanderers': 'Wolves',
            'Brighton & Hove Albion': 'Brighton',
            'Nottingham Forest': 'Forest',
            'Sheffield United': 'Sheff Utd',
            'West Ham United': 'West Ham',
            'Newcastle United': 'Newcastle',
            'Tottenham Hotspur': 'Tottenham',
            'Manchester United': 'Man Utd',
            'Manchester City': 'Man City',
            'Leicester City': 'Leicester',
            'Ipswich Town': 'Ipswich'
        };

        let processed = 0;
        let errors = 0;

        for (const [teamId, team] of teamsMap) {
            const docId = `team_${teamId}`;
            const shortName = SHORT_NAMES[team.name] || team.name.substring(0, 10); // Simple fallback

            const teamData = {
                name: team.name,
                short_name: shortName,
                logo_url: `${TEAM_LOGO_BASE_URL}/${teamId}.png`
            };

            try {
                try {
                    await db.updateDocument(DATABASE_ID, COLL_TEAMS, docId, teamData);
                } catch (updateErr) {
                    if (updateErr.code === 404) {
                        await db.createDocument(DATABASE_ID, COLL_TEAMS, docId, teamData);
                    } else {
                        throw updateErr;
                    }
                }
                processed++;
            } catch (err) {
                error(`Failed to sync team ${team.name} (${docId}): ${err.message}`);
                errors++;
            }
        }

        return { success: true, processed, errors };
    } catch (err) {
        error(`Sync Teams Error: ${err.message}`);
        throw err;
    }
}

// --- LOGIC: Sync Fixtures ---
async function syncFixtures(db, log, error) {
    try {
        const matches = await fetchLeagueData(log);
        let processed = 0;
        let errors = 0;

        for (const match of matches) {
            const docId = `match_${match.id}`; // New ID format for FotMob

            // Map Status
            let status = 'SCHEDULED';
            if (match.status) {
                if (match.status.finished) {
                    status = 'FINISHED';
                } else if (match.status.started || match.status.live) {
                    status = 'IN_PLAY';
                } else if (match.status.cancelled) {
                    status = 'POSTPONED'; // Or handle as desired
                }
            }

            // Map Scores
            // FotMob structure: status.scoreStr (e.g. "2 - 1") or separate fields?
            // Usually match.home.score and match.away.score are present in the list view
            let homeScore = 0;
            let awayScore = 0;

            // Check if score is available in the object
            // If match is not started, scores might be undefined or null
            // We only trust scores if started/finished
            if (status === 'IN_PLAY' || status === 'FINISHED') {
                // Try parsing from status.scoreStr if home.score is missing
                // Or use match.home.score (if numeric)
                const hScore = match.home.score;
                const aScore = match.away.score;

                homeScore = (hScore !== undefined && hScore !== null) ? parseInt(hScore) : 0;
                awayScore = (aScore !== undefined && aScore !== null) ? parseInt(aScore) : 0;
            }

            const fixtureData = {
                external_id: match.id,
                gameweek: match.round || 0, // "round": 1 or "roundName": "Round 1"
                home_team_id: `team_${match.home.id}`,
                away_team_id: `team_${match.away.id}`,
                date: match.status?.utcTime || match.time || new Date().toISOString(),
                status: status,
                home_score: homeScore,
                away_score: awayScore,
                minute: match.status?.liveTime ? parseInt(match.status.liveTime) : 0,
                season: 2025 // Static for now, or derive
            };

            // Fix for "round" sometimes being an object or string
            if (typeof match.round === 'object') fixtureData.gameweek = 0;
            // Better parsing for round could go here if needed

            try {
                await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
            } catch (err) {
                if (err.code === 404) {
                    try {
                        await db.createDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
                    } catch (createErr) {
                        error(`Failed to create fixture ${docId}: ${createErr.message}`);
                        errors++;
                    }
                } else {
                    error(`Failed to update fixture ${docId}: ${err.message}`);
                    errors++;
                }
            }
            processed++;
        }

        return { success: true, processed, errors };
    } catch (err) {
        error(`Sync Fixtures Error: ${err.message}`);
        throw err;
    }
}

// --- LOGIC: Live / Today Updates ---
// Reuses the main fetch but filters for efficiency if needed. 
// Since we fetch all matches in one lightweight request, we can just filter in memory.
async function syncLiveOrToday(db, log, error, mode = 'LIVE') {
    try {
        const matches = await fetchLeagueData(log);
        const today = new Date().toISOString().split('T')[0];

        let targetMatches = [];

        if (mode === 'LIVE') {
            targetMatches = matches.filter(m => m.status && (m.status.live || (m.status.started && !m.status.finished)));
        } else if (mode === 'TODAY') {
            targetMatches = matches.filter(m => {
                const mDate = m.status?.utcTime || m.time;
                return mDate && mDate.startsWith(today);
            });
        }

        log(`Docs to update for ${mode}: ${targetMatches.length}`);

        let processed = 0;
        let errors = 0;

        for (const match of targetMatches) {
            const docId = `match_${match.id}`;

            // Recalculate status/score/time
            let status = 'SCHEDULED';
            if (match.status) {
                if (match.status.finished) status = 'FINISHED';
                else if (match.status.started || match.status.live) status = 'IN_PLAY';
            }

            let homeScore = 0;
            let awayScore = 0;
            const hScore = match.home.score;
            const aScore = match.away.score;
            homeScore = (hScore !== undefined && hScore !== null) ? parseInt(hScore) : 0;
            awayScore = (aScore !== undefined && aScore !== null) ? parseInt(aScore) : 0;

            const updateData = {
                status: status,
                home_score: homeScore,
                away_score: awayScore,
                minute: match.status?.liveTime ? parseInt(match.status.liveTime) : 0,
            };

            try {
                await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, updateData);
                processed++;
            } catch (err) {
                // If 404, we ignore for live updates (should have been synced by main sync)
                // Or we can log it
                // error(`Live update 404 for ${docId}: ${err.message}`);
                errors++;
            }
        }

        return { success: true, action: mode, count: targetMatches.length, processed, errors };
    } catch (err) {
        error(`${mode} Sync Error: ${err.message}`);
        throw err;
    }
}


// --- MAIN HANDLER ---
export default async ({ req, res, log, error }) => {
    log('Function started (FotMob Integration 🚀)');

    // Parse Body
    let body = {};
    try {
        if (typeof req.body === 'string') {
            body = req.body ? JSON.parse(req.body) : {};
        } else {
            body = req.body || {};
        }
    } catch (e) {
        log(`Body parse error: ${e.message}`);
        body = {};
    }

    const action = body.action || 'SYNC_FIXTURES';
    log(`Action: ${action}`);

    if (!API_KEY) {
        error('APPWRITE_API_KEY is missing');
        return res.json({ success: false, error: 'Configuration Error: Appwrite Key missing' }, 500);
    }

    const db = getClient();

    try {
        let result;
        switch (action) {
            case 'SYNC_TEAMS':
                result = await syncTeams(db, log, error);
                break;
            case 'SYNC_FIXTURES':
                result = await syncFixtures(db, log, error);
                break;
            case 'LIVE_UPDATES':
                result = await syncLiveOrToday(db, log, error, 'LIVE');
                break;
            case 'TODAY_MATCHES':
                result = await syncLiveOrToday(db, log, error, 'TODAY');
                break;
            default:
                return res.json({ success: false, error: 'Unknown Action' }, 400);
        }

        log(`Success: ${result.processed} processed, ${result.errors} errors`);
        return res.json(result);
    } catch (err) {
        return res.json({ success: false, error: err.message }, 500);
    }
};

