import { Client, Databases, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League

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
    'AFC Bournemouth': 'Bournemouth',
    'Crystal Palace': 'Palace',
    'Aston Villa': 'Villa'
};

// Appwrite Client Helper
const getDb = () => {
    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

const apiClient = axios.create({
    baseURL: FOTMOB_BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.fotmob.com/',
        'Accept': 'application/json'
    }
});

// --- HELPER: Check Polling Window ---
async function checkPollingWindow(db, log) {
    try {
        const fixtures = await db.listDocuments(DATABASE_ID, FIXTURES_COLLECTION_ID, [
            Query.equal('season', 2025),
            Query.orderAsc('date'),
            Query.limit(500)
        ]);

        if (!fixtures.documents.length) {
            return { inWindow: false, reason: 'No fixtures found' };
        }

        const now = new Date();
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

        if (!activeGameweek) {
            return { inWindow: false, reason: 'All gameweeks finished' };
        }

        const gwFixtures = fixtures.documents.filter(f => f.gameweek === activeGameweek);
        const dates = gwFixtures.map(f => new Date(f.date));
        const firstMatch = new Date(Math.min(...dates));
        const lastMatch = new Date(Math.max(...dates));

        // Window: Midnight day BEFORE first match -> Midnight day AFTER last match
        const windowStart = new Date(firstMatch);
        windowStart.setDate(windowStart.getDate() - 1);
        windowStart.setHours(0, 0, 0, 0);

        const windowEnd = new Date(lastMatch);
        windowEnd.setDate(windowEnd.getDate() + 2);
        windowEnd.setHours(0, 0, 0, 0);

        const inWindow = now >= windowStart && now <= windowEnd;

        return {
            inWindow,
            reason: inWindow ? 'Within active window' : `Outside window (GW${activeGameweek})`,
            activeGameweek,
            windowStart,
            windowEnd
        };
    } catch (err) {
        log(`Polling window check failed: ${err.message}, defaulting to IN window`);
        return { inWindow: true, reason: 'Check failed, defaulting to active' };
    }
}

export default async ({ req, res, log, error }) => {
    log('=== get_pl_fixtures v2 (Smart Polling) ===');

    // Determine if this is a scheduled (CRON) trigger
    const isSchedule = req.headers?.['x-appwrite-trigger'] === 'schedule';

    // Parse request
    let params = {};
    try {
        if (typeof req.body === 'string' && req.body) {
            params = JSON.parse(req.body);
        } else if (req.body) {
            params = req.body;
        }
    } catch (e) {
        params = {};
    }

    const { gameweek, liveOnly, todayOnly } = params;
    log(`Filters: gameweek=${gameweek || 'all'}, liveOnly=${liveOnly}, todayOnly=${todayOnly}`);

    // Check polling window for scheduled runs
    if (isSchedule && API_KEY) {
        const db = getDb();
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

    try {
        // Fetch from FotMob
        const response = await apiClient.get('/leagues', {
            params: { id: FOTMOB_LEAGUE_ID, tab: 'matches' }
        });

        const data = response.data;
        let allMatches = data.fixtures?.allMatches || data.matches?.allMatches || data.allMatches || [];

        log(`FotMob returned ${allMatches.length} matches.`);

        // Transform to our format
        const today = new Date().toISOString().split('T')[0];

        let fixtures = allMatches.map(m => {
            // Determine status
            let status = 'SCHEDULED';
            if (m.status) {
                if (m.status.finished) status = 'FINISHED';
                else if (m.status.started || m.status.live) status = 'IN_PLAY';
                else if (m.status.cancelled) status = 'POSTPONED';
            }

            // Parse score
            let homeScore = null;
            let awayScore = null;
            if (status === 'IN_PLAY' || status === 'FINISHED') {
                if (m.status?.scoreStr) {
                    const parts = m.status.scoreStr.split('-');
                    if (parts.length === 2) {
                        homeScore = parseInt(parts[0].trim()) || 0;
                        awayScore = parseInt(parts[1].trim()) || 0;
                    }
                }
            }

            // Get minute
            let minute = null;
            if (m.status?.liveTime?.short) {
                minute = m.status.liveTime.short;
            } else if (m.status?.liveTime) {
                minute = String(m.status.liveTime);
            }

            return {
                id: m.id,
                gameweek: parseInt(m.round) || 0,
                date: m.status?.utcTime || m.time,
                status: status,
                minute: minute,
                home: {
                    id: m.home?.id,
                    name: m.home?.name,
                    shortName: SHORT_NAMES[m.home?.name] || m.home?.shortName || m.home?.name?.substring(0, 10),
                    logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home?.id}.png`
                },
                away: {
                    id: m.away?.id,
                    name: m.away?.name,
                    shortName: SHORT_NAMES[m.away?.name] || m.away?.shortName || m.away?.name?.substring(0, 10),
                    logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away?.id}.png`
                },
                homeScore: homeScore,
                awayScore: awayScore
            };
        });

        // Apply filters
        if (gameweek) {
            fixtures = fixtures.filter(f => f.gameweek === parseInt(gameweek));
        }

        if (liveOnly) {
            fixtures = fixtures.filter(f => f.status === 'IN_PLAY');
        }

        if (todayOnly) {
            fixtures = fixtures.filter(f => f.date && f.date.startsWith(today));
        }

        log(`Returning ${fixtures.length} fixtures after filtering.`);

        return res.json({
            success: true,
            count: fixtures.length,
            fixtures: fixtures
        });

    } catch (err) {
        error(`FotMob Error: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
