import { Client, Databases } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const FIXTURES_COLLECTION_ID = process.env.COLL_FIXTURES || 'fixtures';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_IMG_URL = 'https://images.fotmob.com/image_resources/playerimages';

const getClient = () => {
    const client = new Client()
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// Fuzzy match for team names
const correlateTeams = (appwriteName, apiName) => {
    if (!appwriteName || !apiName) return false;
    const cleanApp = appwriteName.toLowerCase().replace(/fc|afc/g, '').trim();
    const cleanApi = apiName.toLowerCase().replace(/fc|afc/g, '').trim();
    if (cleanApp.includes(cleanApi) || cleanApi.includes(cleanApp)) return true;
    return false;
};

export default async ({ req, res, log, error }) => {
    log('Fetch Lineups & Events [v26 - Shirt Number Fix 👕]');

    if (!API_KEY) {
        error('Configuration Error: Missing Appwrite API Key');
        return res.json({ success: false, error: 'Missing Configuration' }, 500);
    }

    const apiClient = axios.create({
        baseURL: FOTMOB_BASE_URL,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.fotmob.com/',
            'Accept': 'application/json, text/plain, */*'
        }
    });

    let body = {};
    try {
        body = req.body ? JSON.parse(req.body) : {};
    } catch (e) {
        body = req.body || {};
    }

    const { fixtureId, date, homeTeamName, awayTeamName, homeTeamShort, awayTeamShort } = body;
    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];

    log(`Request for: ${homeTeamName} vs ${awayTeamName} on ${dateStr}`);

    if (!fixtureId || !date || !homeTeamName) {
        return res.json({ success: false, error: 'Missing parameters' }, 400);
    }

    try {
        const leagueResp = await apiClient.get('/leagues', {
            params: { id: 47, tab: 'matches' }
        });

        const leagueData = leagueResp.data;
        let allMatches = [];
        if (leagueData.fixtures && leagueData.fixtures.allMatches) {
            allMatches = leagueData.fixtures.allMatches;
        } else if (leagueData.matches) {
            allMatches = Array.isArray(leagueData.matches) ? leagueData.matches : (leagueData.matches.allMatches || []);
        }

        const matchToUse = allMatches.find(m => {
            const h = m.home.name;
            const a = m.away.name;
            const homeMatch = correlateTeams(homeTeamName, h) || (homeTeamShort && correlateTeams(homeTeamShort, h));
            const awayMatch = correlateTeams(awayTeamName, a) || (awayTeamShort && correlateTeams(awayTeamShort, a));
            if (homeMatch && awayMatch) {
                const mDate = new Date(m.status?.utcTime || m.time || date);
                const diff = Math.abs(mDate - dateObj);
                if (diff < 48 * 60 * 60 * 1000) return true;
            }
            return false;
        });

        // Handle case where match is truly not found
        if (!matchToUse) {
            // Note: If no match found, maybe it's postponed or date is way off.
            // Just return empty lineups to avoid client error, or message
            return res.json({ success: false, message: `FotMob: Match not found.` });
        }

        const fotmobId = matchToUse.id;
        log(`FotMob Match ID: ${fotmobId}`);

        const detailsResp = await apiClient.get('/matchDetails', {
            params: { matchId: fotmobId }
        });

        const content = detailsResp.data.content;
        if (!content) return res.json({ success: false, message: `No content for match ${fotmobId}` });

        const lineupsObj = content.lineup;
        const eventsRaw = content.matchFacts?.events?.events;

        const mapFotMobPlayer = (p) => {
            // FIX: added p.shirtNumber (verified in JSON inspection)
            const num = p.shirtNumber || p.shirt || p.jerseyNumber || 0;
            return {
                id: p.id,
                name: p.name?.firstName ? `${p.name.firstName} ${p.name.lastName}` : p.name,
                number: num,
                position: p.role || p.position || 'Unknown',
                image: `${FOTMOB_IMG_URL}/${p.id}.png`,
                grid: null
            };
        };

        const homeLineupData = lineupsObj?.homeTeam ? {
            formation: lineupsObj.homeTeam.formation,
            lineup: (lineupsObj.homeTeam.starters || []).map(mapFotMobPlayer),
            bench: (lineupsObj.homeTeam.bench || []).map(mapFotMobPlayer)
        } : null;

        const awayLineupData = lineupsObj?.awayTeam ? {
            formation: lineupsObj.awayTeam.formation,
            lineup: (lineupsObj.awayTeam.starters || []).map(mapFotMobPlayer),
            bench: (lineupsObj.awayTeam.bench || []).map(mapFotMobPlayer)
        } : null;

        const lineupsData = {
            home: homeLineupData,
            away: awayLineupData,
            events: (eventsRaw || []).map(e => ({
                type: e.type,
                detail: e.card || (e.type === 'Goal' ? 'Goal' : e.type),
                time: { elapsed: e.time, extra: e.overloadTime },
                player: { id: e.player?.id, name: e.player?.name },
                assist: e.assist ? { id: e.assist.id, name: e.assist.name } : null,
                team: { name: e.isHome ? homeTeamName : awayTeamName },
                isHome: e.isHome
            }))
        };

        const db = getClient();
        await db.updateDocument(
            DATABASE_ID,
            FIXTURES_COLLECTION_ID,
            fixtureId,
            { lineups: JSON.stringify(lineupsData) }
        );

        return res.json({ success: true, lineups: lineupsData });

    } catch (err) {
        error(`Error: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
