import { Client, Databases, ID, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY; // Appwrite API Key
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';
const COLL_TEAMS = process.env.COLL_TEAMS || 'real_teams';
const FOOTBALL_DATA_KEY = process.env.RAPIDAPI_KEY;

// Football-Data.org Configuration
const API_BASE_URL = 'https://api.football-data.org/v4';
const COMPETITION_ID = 'PL'; // Premier League
const SEASON = 2025; // 2025-2026 season (current)

// Appwrite Helper
const getClient = () => {
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// --- HELPER: Integrity Check (Self-Healing) ---
async function ensureTeamsExist(db, log, error) {
    try {
        const existing = await db.listDocuments(DATABASE_ID, COLL_TEAMS, [Query.limit(1)]);
        if (existing.total < 20) {
            log(`[Self-Healing] Only ${existing.total}/20 teams found. Triggering Auto-Sync...`);
            await syncTeams(db, log, error);
        }
    } catch (e) {
        log(`[Self-Healing] Check failed: ${e.message}`);
    }
}

// --- LOGIC: Sync Teams ---
async function syncTeams(db, log, error, season = SEASON) {
    log(`Fetching teams from Football-Data.org for season ${season}...`);

    try {
        const response = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/teams`, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
            params: { season: season }
        });

        const teams = response.data.teams;
        log(`Found ${teams.length} teams.`);

        // CUSTOM MAPPING: Override names to be readable but < 10 chars (DB Limit)
        // This solves "Wolverhampton" (13 chars) vs DB Limit (10 chars), satisfying user request for "Wolves"
        const SHORT_NAME_OVERRIDES = {
            'Wolverhampton Wanderers FC': 'Wolves',
            'Brighton & Hove Albion FC': 'Brighton',
            'AFC Bournemouth': 'B\'mouth',
            'Crystal Palace FC': 'Palace',
            'Aston Villa FC': 'Villa',
            'Tottenham Hotspur FC': 'Tottenham',
            'Nottingham Forest FC': 'Forest',
            'West Ham United FC': 'West Ham',
            'Newcastle United FC': 'Newcastle',
            'Sheffield United FC': 'Sheff Utd',
            'Leeds United FC': 'Leeds',
            'Leicester City FC': 'Leicester',
            'Southampton FC': 'Soton',
            'Ipswich Town FC': 'Ipswich'
        };

        let processed = 0;
        let errors = 0;
        let errorDetails = [];

        for (const team of teams) {
            const docId = `team_${team.id}`;

            // PRIORITY: Override List > API Short Name > API Name > 3-letter fallback
            let shortName = SHORT_NAME_OVERRIDES[team.name] || team.shortName || team.tla || 'UNK';

            // If still too long for DB (10 chars) despite overrides, fallback to TLA (3 chars)
            if (shortName.length > 10) {
                shortName = team.tla || team.name?.substring(0, 3)?.toUpperCase() || 'UNK';
            }

            const teamData = {
                name: team.name,
                short_name: shortName,
                logo_url: team.crest
            };

            // 1. Clean Data
            if (!teamData.logo_url) delete teamData.logo_url;

            // 2. Try Update/Insert with Fallback
            try {
                // Try Upsert
                try {
                    await db.updateDocument(DATABASE_ID, COLL_TEAMS, docId, teamData);
                } catch (updateErr) {
                    if (updateErr.code === 404) {
                        await db.createDocument(DATABASE_ID, COLL_TEAMS, docId, teamData);
                    } else {
                        throw updateErr;
                    }
                }
            } catch (err) {
                // RETRY STRATEGY: If validation failed (likely URL), retry without logo
                if (teamData.logo_url) {
                    delete teamData.logo_url;
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
                        log(`Recovered team ${team.name} by removing invalid logo.`);
                        processed++;
                        continue; // Skip error increment
                    } catch (retryErr) {
                        errorDetails.push(`${team.name}: ${retryErr.message}`);
                        errors++;
                    }
                } else {
                    errorDetails.push(`${team.name}: ${err.message}`);
                    errors++;
                }
            }
            processed++;
        }

        return { success: true, processed, errors, details: errorDetails };
    } catch (err) {
        error(`API Error: ${err.message}`);
        throw err;
    }
}

// --- LOGIC: Sync Fixtures ---
async function syncFixtures(db, log, error) {
    log('Fetching fixtures from Football-Data.org...');

    try {
        const response = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/matches`, {
            headers: {
                'X-Auth-Token': FOOTBALL_DATA_KEY
            },
            params: {
                season: SEASON
            }
        });

        const matches = response.data.matches;
        log(`Found ${matches.length} matches.`);

        let processed = 0;
        let errors = 0;

        for (const match of matches) {
            const docId = `pl_${match.id}`; // Custom ID strategy

            // Map Status
            let status = match.status; // SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED

            // Map Scores (Handle live/finished)
            let homeScore = null;
            let awayScore = null;

            if (status === 'FINISHED' || status === 'IN_PLAY' || status === 'PAUSED') {
                homeScore = match.score.fullTime.home ?? match.score.halfTime.home ?? 0;
                awayScore = match.score.fullTime.away ?? match.score.halfTime.away ?? 0;
            }

            const fixtureData = {
                external_id: match.id,
                gameweek: match.matchday || 0,
                home_team_id: `team_${match.homeTeam.id}`,
                away_team_id: `team_${match.awayTeam.id}`,
                date: match.utcDate,
                status: status,
                home_score: homeScore,
                away_score: awayScore,
                minute: match.minute || 0,
                season: SEASON
            };

            try {
                // Upsert logic
                await db.updateDocument(
                    DATABASE_ID,
                    FIXTURES_COLLECTION_ID,
                    docId,
                    fixtureData
                );
            } catch (err) {
                if (err.code === 404) {
                    try {
                        await db.createDocument(
                            DATABASE_ID,
                            FIXTURES_COLLECTION_ID,
                            docId,
                            fixtureData
                        );
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
        error(`API Error: ${err.message}`);
        if (err.response) {
            error(`API Response: ${JSON.stringify(err.response.data)}`);
        }
        throw err;
    }
}

// --- LOGIC: Fetch Live Matches (IN_PLAY only) ---
async function fetchLiveMatches(db, log, error) {
    // SELF-HEALING: Check if teams are missing before updating matches
    // This allows the cron job to auto-fix missing teams without user intervention
    await ensureTeamsExist(db, log, error);

    log('Fetching LIVE matches from Football-Data.org...');

    try {
        const response = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/matches`, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
            params: { status: 'LIVE' }
        });

        const matches = response.data.matches || [];
        log(`Found ${matches.length} live matches.`);

        let processed = 0;
        let errors = 0;

        for (const match of matches) {
            const docId = `pl_${match.id}`;

            const fixtureData = {
                status: match.status,
                home_score: match.score.fullTime.home ?? match.score.halfTime.home ?? 0,
                away_score: match.score.fullTime.away ?? match.score.halfTime.away ?? 0,
                minute: match.minute || null // Try to update minute if available
            };

            try {
                await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
                processed++;
            } catch (err) {
                error(`Failed to update live fixture ${docId}: ${err.message}`);
                errors++;
            }
        }

        return { success: true, action: 'LIVE_UPDATES', liveCount: matches.length, processed, errors };
    } catch (err) {
        error(`API Error: ${err.message}`);
        throw err;
    }
}

// --- LOGIC: Fetch Today's Matches ---
async function fetchTodayMatches(db, log, error) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    log(`Fetching matches for today (${today})...`);

    try {
        const response = await axios.get(`${API_BASE_URL}/competitions/${COMPETITION_ID}/matches`, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY },
            params: { dateFrom: today, dateTo: today }
        });

        const matches = response.data.matches || [];
        log(`Found ${matches.length} matches today.`);

        let processed = 0;
        let errors = 0;

        for (const match of matches) {
            const docId = `pl_${match.id}`;

            let homeScore = null;
            let awayScore = null;
            if (match.status === 'FINISHED' || match.status === 'IN_PLAY' || match.status === 'PAUSED') {
                homeScore = match.score.fullTime.home ?? match.score.halfTime.home ?? 0;
                awayScore = match.score.fullTime.away ?? match.score.halfTime.away ?? 0;
            }

            const fixtureData = {
                status: match.status,
                home_score: homeScore,
                away_score: awayScore,
                minute: match.minute || null
            };

            try {
                await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
                processed++;
            } catch (err) {
                error(`Failed to update today fixture ${docId}: ${err.message}`);
                errors++;
            }
        }

        return { success: true, action: 'TODAY_MATCHES', todayCount: matches.length, processed, errors };
    } catch (err) {
        error(`API Error: ${err.message}`);
        throw err;
    }
}


// --- MAIN HANDLER ---
export default async ({ req, res, log, error }) => {
    log('Function started (Football-Data.org version)');

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
    const season = body.season || SEASON; // Allow override

    log(`Action: ${action}, Season: ${season}`);

    if (!FOOTBALL_DATA_KEY) {
        error('RAPIDAPI_KEY (used as Auth Token) is missing');
        return res.json({ success: false, error: 'Configuration Error: Key missing' }, 500);
    }

    if (!API_KEY) {
        error('APPWRITE_API_KEY is missing');
        return res.json({ success: false, error: 'Configuration Error: Appwrite Key missing' }, 500);
    }

    const db = getClient();

    try {
        let result;
        switch (action) {
            case 'SYNC_FIXTURES':
                result = await syncFixtures(db, log, error);
                break;
            case 'LIVE_UPDATES':
                result = await fetchLiveMatches(db, log, error);
                break;
            case 'TODAY_MATCHES':
                result = await fetchTodayMatches(db, log, error);
                break;
            case 'SYNC_TEAMS':
                result = await syncTeams(db, log, error, season);
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
