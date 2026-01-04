import { Client, Databases, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';
const COLL_TEAMS = process.env.COLL_TEAMS || 'real_teams';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League
const TEAM_LOGO_BASE_URL = 'https://images.fotmob.com/image_resources/logo/teamlogo';

// Short Names Override
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
    'Ipswich Town': 'Ipswich',
    'AFC Bournemouth': 'Bournemouth'
};

// Appwrite Client Helper
const getClient = () => {
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// FotMob API Client
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
                    log(`Error: ${r.error.message}`);
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
        log('Starting SYNC_TEAMS...');
        const matches = await fetchLeagueData(log);
        const teamsMap = new Map();
        matches.forEach(m => {
            if (m.home) teamsMap.set(m.home.id, { id: m.home.id, name: m.home.name });
            if (m.away) teamsMap.set(m.away.id, { id: m.away.id, name: m.away.name });
        });

        log(`Found ${teamsMap.size} unique teams.`);
        const teams = Array.from(teamsMap.values());

        const { processed, errors: errCount } = await processInBatches(teams, 10, async (team) => {
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

        return { success: true, processed, errors: errCount };
    } catch (err) {
        error(`SYNC_TEAMS Failed: ${err.message}`);
        throw err;
    }
}

// --- LOGIC: Sync Fixtures (Full) ---
async function syncFixtures(db, log, error) {
    try {
        log('Starting SYNC_FIXTURES...');
        const matches = await fetchLeagueData(log);

        const { processed, errors: errCount } = await processInBatches(matches, 25, async (match) => {
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
                    if (match.home?.score !== undefined) homeScore = parseInt(match.home.score);
                    if (match.away?.score !== undefined) awayScore = parseInt(match.away.score);
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
                minute: match.status?.liveTime?.short ? parseInt(match.status.liveTime.short) : 0,
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

        return { success: true, processed, errors: errCount };
    } catch (err) {
        error(`SYNC_FIXTURES Failed: ${err.message}`);
        throw err;
    }
}

// --- HELPER: Check Polling Window ---
// Returns { inWindow: boolean, reason: string, windowStart: Date, windowEnd: Date }
async function checkPollingWindow(db, log) {
    try {
        // Get all fixtures for current season to find gameweek boundaries
        const fixtures = await db.listDocuments(DATABASE_ID, FIXTURES_COLLECTION_ID, [
            Query.equal('season', 2025),
            Query.orderAsc('date'),
            Query.limit(500)
        ]);

        if (!fixtures.documents.length) {
            return { inWindow: false, reason: 'No fixtures found' };
        }

        const now = new Date();

        // Find the "active" gameweek based on current date
        // Active = first gameweek where not all matches are finished
        const gameweeks = [...new Set(fixtures.documents.map(f => f.gameweek))].sort((a, b) => a - b);

        let activeGameweek = null;
        for (const gw of gameweeks) {
            const gwFixtures = fixtures.documents.filter(f => f.gameweek === gw);
            const allFinished = gwFixtures.every(f => f.status === 'FINISHED');
            if (!allFinished) {
                activeGameweek = gw;
                break;
            }
        }

        // If all gameweeks are finished, no polling needed
        if (!activeGameweek) {
            return { inWindow: false, reason: 'All gameweeks finished' };
        }

        // Get fixtures for active gameweek
        const gwFixtures = fixtures.documents.filter(f => f.gameweek === activeGameweek);
        const dates = gwFixtures.map(f => new Date(f.date));
        const firstMatch = new Date(Math.min(...dates));
        const lastMatch = new Date(Math.max(...dates));

        // Window: Midnight day BEFORE first match -> Midnight day AFTER last match
        const windowStart = new Date(firstMatch);
        windowStart.setDate(windowStart.getDate() - 1);
        windowStart.setHours(0, 0, 0, 0);

        const windowEnd = new Date(lastMatch);
        windowEnd.setDate(windowEnd.getDate() + 2); // +2 because we want midnight AFTER the day
        windowEnd.setHours(0, 0, 0, 0);

        const inWindow = now >= windowStart && now <= windowEnd;

        return {
            inWindow,
            reason: inWindow ? 'Within active window' : `Outside window (GW${activeGameweek}: ${windowStart.toISOString()} - ${windowEnd.toISOString()})`,
            activeGameweek,
            windowStart,
            windowEnd
        };
    } catch (err) {
        log(`Polling window check failed: ${err.message}, defaulting to IN window`);
        return { inWindow: true, reason: 'Check failed, defaulting to active' };
    }
}

// --- LOGIC: Live / Today Updates (Lightweight) ---
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

        log(`${mode}: Found ${targetMatches.length} matches to update.`);

        let processed = 0;
        let errors = 0;

        for (const match of targetMatches) {
            const docId = `match_${match.id}`;

            let status = 'SCHEDULED';
            if (match.status) {
                if (match.status.finished) status = 'FINISHED';
                else if (match.status.started || match.status.live) status = 'IN_PLAY';
            }

            let homeScore = 0;
            let awayScore = 0;
            if (match.status?.scoreStr) {
                const parts = match.status.scoreStr.split('-');
                if (parts.length === 2) {
                    homeScore = parseInt(parts[0].trim()) || 0;
                    awayScore = parseInt(parts[1].trim()) || 0;
                }
            }

            const updateData = {
                status: status,
                home_score: homeScore,
                away_score: awayScore,
                minute: match.status?.liveTime?.short ? parseInt(match.status.liveTime.short) : 0
            };

            try {
                await db.updateDocument(DATABASE_ID, FIXTURES_COLLECTION_ID, docId, updateData);
                processed++;
                log(`✅ Updated ${docId}: ${homeScore}-${awayScore} (${status})`);
            } catch (err) {
                log(`❌ Failed ${docId}: ${err.message}`);
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
    log('=== fetch_pl_data v10 (Smart Polling Window) ===');

    // Parse Body
    let body = {};
    try {
        if (typeof req.body === 'string') {
            body = req.body ? JSON.parse(req.body) : {};
        } else {
            body = req.body || {};
        }
    } catch (e) {
        body = {};
    }

    // Determine Trigger Type
    const isSchedule = req.headers?.['x-appwrite-trigger'] === 'schedule';
    let action = body.action || (isSchedule ? 'LIVE_UPDATES' : 'SYNC_FIXTURES');

    log(`Trigger: ${isSchedule ? 'CRON' : 'HTTP'} | Action: ${action}`);

    if (!API_KEY) {
        error('APPWRITE_API_KEY is missing');
        return res.json({ success: false, error: 'Configuration Error' }, 500);
    }

    const db = getClient();

    try {
        // SYNC TEAMS
        if (action === 'SYNC_TEAMS') {
            const result = await syncTeams(db, log, error);
            return res.json(result);
        }

        // SYNC FIXTURES (Full)
        if (action === 'SYNC_FIXTURES') {
            const result = await syncFixtures(db, log, error);
            return res.json(result);
        }

        // LIVE UPDATES with 30s Loop
        if (action === 'LIVE_UPDATES' || action === 'TODAY_MATCHES') {
            const mode = action === 'TODAY_MATCHES' ? 'TODAY' : 'LIVE';

            // Check if we're inside the polling window (only for scheduled runs)
            if (isSchedule) {
                const windowCheck = await checkPollingWindow(db, log);
                log(`📅 Polling Window: ${windowCheck.reason}`);

                if (!windowCheck.inWindow) {
                    return res.json({
                        success: true,
                        skipped: true,
                        reason: windowCheck.reason,
                        message: 'Outside polling window, no updates needed'
                    });
                }
            }

            // Run 1
            log(`[Run 1] ${mode} update...`);
            const result1 = await syncLiveOrToday(db, log, error, mode);
            log(`[Run 1] Done: ${result1.processed} updated`);

            // If scheduled, wait 30s and run again
            if (isSchedule || body.loop) {
                log('⏳ Waiting 30 seconds...');
                await new Promise(resolve => setTimeout(resolve, 30000));

                log(`[Run 2] ${mode} update...`);
                const result2 = await syncLiveOrToday(db, log, error, mode);
                log(`[Run 2] Done: ${result2.processed} updated`);

                return res.json({
                    success: true,
                    run1: result1,
                    run2: result2,
                    message: "30s double update completed"
                });
            }

            return res.json(result1);
        }

        return res.json({ success: false, error: 'Unknown Action' }, 400);

    } catch (err) {
        error(`Handler Failed: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
