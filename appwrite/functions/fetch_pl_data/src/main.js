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

// --- MAIN HANDLER ---
export default async ({ req, res, log, error }) => {
    log('--- Function started (Debug v3) ---');

    // 1. Debug Env Vars
    log(`Env Check: PROJECT_ID=${PROJECT_ID ? 'OK' : 'MISSING'}`);
    log(`Env Check: API_KEY=${API_KEY ? 'OK' : 'MISSING'}`);
    log(`Env Check: DB_ID=${DATABASE_ID}`);
    log(`Env Check: COLL_FIXTURES=${FIXTURES_COLLECTION_ID}`);
    log(`Env Check: COLL_TEAMS=${COLL_TEAMS}`);

    if (!API_KEY || !PROJECT_ID) {
        error('CRITICAL: Missing API_KEY or PROJECT_ID');
        return res.json({ success: false, error: 'Configuration Error' }, 500);
    }

    // 2. Initialize Appwrite
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    const db = new Databases(client);

    // 3. Initialize FotMob Client
    const apiClient = axios.create({
        baseURL: FOTMOB_BASE_URL,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.fotmob.com/',
            'Accept': 'application/json, text/plain, */*'
        }
    });

    // 4. Parse Body
    let body = {};
    try {
        if (typeof req.body === 'string') {
            body = req.body ? JSON.parse(req.body) : {};
        } else {
            body = req.body || {};
        }
    } catch (e) {
        log(`Body parse warning: ${e.message}`);
        body = {};
    }
    const action = body.action || 'SYNC_FIXTURES';
    log(`Action: ${action}`);

    // --- HELPER: Fetch FotMob Data ---
    async function fetchLeagueData() {
        log('Fetching FotMob API...');
        const response = await apiClient.get('/leagues', {
            params: { id: FOTMOB_LEAGUE_ID, tab: 'matches' }
        });
        const data = response.data;

        let allMatches = [];
        if (data.fixtures && data.fixtures.allMatches) {
            allMatches = data.fixtures.allMatches;
        } else if (data.matches) {
            allMatches = Array.isArray(data.matches) ? data.matches : (data.matches.allMatches || []);
        } else if (data.allMatches) {
            allMatches = data.allMatches;
        }
        log(`FotMob returned ${allMatches.length} matches.`);
        return allMatches;
    }

    // --- HELPER: Batch Processor ---
    async function processInBatches(items, batchSize, processFn, log) {
        let processed = 0;
        let errors = 0;
        let firstErrorLogged = false;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            if (processed % 50 === 0) log(`Processing batch ${i} - ${i + batchSize}...`);

            const results = await Promise.all(batch.map(async (item) => {
                try {
                    await processFn(item);
                    return { success: true };
                } catch (err) {
                    return { success: false, error: err };
                }
            }));

            results.forEach(r => {
                if (r.success) {
                    processed++;
                } else {
                    errors++;
                    if (!firstErrorLogged && log) {
                        log(`Create/Update Error (First Occurrence): ${r.error.message}`);
                        if (r.error.response) log(`API Response: ${JSON.stringify(r.error.response)}`);
                        firstErrorLogged = true;
                    }
                }
            });
        }
        return { processed, errors };
    }

    // --- LOGIC: Sync Teams ---
    async function syncTeams(db, log, error) {
        try {
            log('Starting SYNC_TEAMS (Parallel)...');
            const matches = await fetchLeagueData(log); // Pass log
            const teamsMap = new Map();
            matches.forEach(m => {
                if (m.home) teamsMap.set(m.home.id, { id: m.home.id, name: m.home.name });
                if (m.away) teamsMap.set(m.away.id, { id: m.away.id, name: m.away.name });
            });

            log(`Unique teams found: ${teamsMap.size}`);
            const teams = Array.from(teamsMap.values());

            const { processed, errors } = await processInBatches(teams, 10, async (team) => {
                const docId = `team_${team.id}`;
                const shortName = SHORT_NAMES[team.name] || team.name.substring(0, 10);
                const data = {
                    name: team.name,
                    short_name: shortName,
                    logo_url: `${TEAM_LOGO_BASE_URL}/${team.id}.png`
                };
                try {
                    await db.updateDocument(DATABASE_ID, COLL_TEAMS, docId, data);
                } catch (err) {
                    if (err.code === 404) {
                        await db.createDocument(DATABASE_ID, COLL_TEAMS, docId, data);
                    } else throw err;
                }
            }, log);

            log(`SYNC_TEAMS Completed: ${processed} updated, ${errors} failed`);
            return { success: true, processed, errors };
        } catch (err) {
            error(`SYNC_TEAMS Failed: ${err.message}`);
            throw err;
        }
    }

    // --- LOGIC: Sync Fixtures ---
    async function syncFixtures(db, log, error) {
        try {
            log('Starting SYNC_FIXTURES (Parallel)...');
            const matches = await fetchLeagueData(log); // Pass log

            const { processed, errors } = await processInBatches(matches, 25, async (match) => {
                const docId = `match_${match.id}`;
                let status = 'SCHEDULED';
                if (match.status) {
                    if (match.status.finished) status = 'FINISHED';
                    else if (match.status.started || match.status.live) status = 'IN_PLAY';
                    else if (match.status.cancelled) status = 'POSTPONED';
                }

                let homeScore = 0;
                let awayScore = 0;
                if (status === 'IN_PLAY' || status === 'FINISHED') {
                    if (match.status?.scoreStr) {
                        const parts = match.status.scoreStr.split('-');
                        if (parts.length === 2) {
                            homeScore = parseInt(parts[0].trim()) || 0;
                            awayScore = parseInt(parts[1].trim()) || 0;
                        }
                    } else {
                        if (match.home?.score) homeScore = parseInt(match.home.score);
                        if (match.away?.score) awayScore = parseInt(match.away.score);
                    }
                }

                const fixtureData = {
                    external_id: match.id,
                    gameweek: match.round ? parseInt(match.round) : 0,
                    home_team_id: `team_${match.home.id}`,
                    away_team_id: `team_${match.away.id}`,
                    date: match.status?.utcTime || match.time || new Date().toISOString(),
                    status: status,
                    home_score: homeScore,
                    away_score: awayScore,
                    minute: match.status?.liveTime ? parseInt(match.status.liveTime) : 0,
                    season: 2025
                };
                if (isNaN(fixtureData.gameweek)) fixtureData.gameweek = 0;

                try {
                    await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
                } catch (err) {
                    if (err.code === 404) {
                        await db.createDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, fixtureData);
                    } else throw err;
                }
            }, log);

            log(`SYNC_FIXTURES Completed: ${processed} updated, ${errors} failed`);
            return { success: true, processed, errors };
        } catch (err) {
            error(`SYNC_FIXTURES Failed: ${err.message}`);
            throw err;
        }
    }

    // --- ACTION HANDLERS ---

    // SYNC TEAMS
    if (action === 'SYNC_TEAMS') {
        try {
            const result = await syncTeams(db, log, error);
            return res.json(result);
        } catch (err) {
            return res.json({ success: false, error: err.message }, 500);
        }
    }

    // SYNC FIXTURES
    if (action === 'SYNC_FIXTURES') {
        try {
            const result = await syncFixtures(db, log, error);
            return res.json(result);
        } catch (err) {
            return res.json({ success: false, error: err.message }, 500);
        }
    }

    return res.json({ success: false, error: 'Unknown Action' }, 400);
};
