import { Client, Databases, Query } from 'node-appwrite';
import axios from 'axios';

// Environment variables
const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const PLAYERS_COLLECTION_ID = process.env.COLL_PLAYERS || 'players';
const TEAMS_COLLECTION_ID = process.env.COLL_TEAMS || 'real_teams';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League
const TEAM_LOGO_BASE_URL = 'https://images.fotmob.com/image_resources/logo/teamlogo';

// Short name overrides
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
        .setEndpoint('https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);
    return new Databases(client);
};

// FotMob API Client
const apiClient = axios.create({
    baseURL: FOTMOB_BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.fotmob.com/',
        'Accept': 'application/json'
    }
});

// Map FotMob position to our simplified roles
const mapPosition = (position) => {
    if (!position) return 'Unknown';
    const pos = position.toLowerCase();
    if (pos.includes('keeper') || pos.includes('portiere')) return 'Portiere';
    if (pos.includes('defender') || pos.includes('back') || pos.includes('difensore')) return 'Difensore';
    if (pos.includes('midfielder') || pos.includes('centrocampista')) return 'Centrocampista';
    if (pos.includes('forward') || pos.includes('striker') || pos.includes('winger') || pos.includes('attaccante')) return 'Attaccante';
    return 'Centrocampista'; // Default
};

// ============ SYNC TEAMS ============
async function syncTeams(db, log) {
    log('Starting SYNC_TEAMS from FotMob...');

    // Fetch league data to get all teams
    const response = await apiClient.get('/leagues', {
        params: { id: FOTMOB_LEAGUE_ID, tab: 'matches' }
    });

    const allMatches = response.data.fixtures?.allMatches || [];
    const teamsMap = new Map();

    // Extract unique teams from matches
    allMatches.forEach(m => {
        if (m.home) teamsMap.set(m.home.id, { id: m.home.id, name: m.home.name });
        if (m.away) teamsMap.set(m.away.id, { id: m.away.id, name: m.away.name });
    });

    log(`Found ${teamsMap.size} unique teams.`);
    const teams = Array.from(teamsMap.values());

    let synced = 0;
    let errors = 0;

    for (const team of teams) {
        const docId = `team_${team.id}`;
        const shortName = SHORT_NAMES[team.name] || team.name.substring(0, 10);
        const data = {
            name: team.name,
            short_name: shortName,
            logo_url: `${TEAM_LOGO_BASE_URL}/${team.id}.png`
        };

        try {
            await db.updateDocument(DATABASE_ID, TEAMS_COLLECTION_ID, docId, data);
            synced++;
        } catch (err) {
            if (err.code === 404) {
                try {
                    await db.createDocument(DATABASE_ID, TEAMS_COLLECTION_ID, docId, data);
                    synced++;
                } catch (createErr) {
                    log(`Error creating team ${team.name}: ${createErr.message}`);
                    errors++;
                }
            } else {
                log(`Error updating team ${team.name}: ${err.message}`);
                errors++;
            }
        }
    }

    return { success: true, action: 'SYNC_TEAMS', teamsFound: teams.length, synced, errors };
}

// ============ SYNC PLAYERS ============
async function syncPlayers(db, log) {
    log('Starting SYNC_PLAYERS from FotMob...');

    // Get all PL teams from our DB
    const teamsResult = await db.listDocuments(DATABASE_ID, TEAMS_COLLECTION_ID, [Query.limit(50)]);
    const teams = teamsResult.documents.map(t => ({
        dbId: t.$id,
        fotmobId: t.$id.replace('team_', ''),
        name: t.name,
        goalkeeper_owner: t.goalkeeper_owner // Fetch GK Block owner
    }));

    log(`Found ${teams.length} teams in DB.`);

    let totalPlayers = 0;
    let syncedPlayers = 0;
    let errors = 0;

    for (const team of teams) {
        log(`Fetching squad for ${team.name}...`);

        try {
            const response = await apiClient.get('/teams', {
                params: { id: team.fotmobId, tab: 'squad' }
            });

            const squadGroups = response.data.squad?.squad || [];

            for (const group of squadGroups) {
                if (group.title === 'coach') continue;

                for (const member of (group.members || [])) {
                    totalPlayers++;
                    const docId = `player_${member.id}`;

                    const role = mapPosition(member.role?.fallback || group.title);
                    const shortName = member.name.split(' ').pop(); // Fallback
                    const baseData = {
                        name: member.name,
                        team_id: team.dbId,
                        team_name: team.name,
                        position: role,
                        fotmob_id: String(member.id),
                        shirt_number: member.shirtNumber ? parseInt(member.shirtNumber) : null,
                        image_url: `https://images.fotmob.com/image_resources/playerimages/${member.id}.png`
                    };

                    // Goalkeeper Block Enforcement
                    if (role === 'Portiere' && team.goalkeeper_owner) {
                        baseData.owner = team.goalkeeper_owner;
                        log(`[GK BLOCK] Assigning ${baseData.name} (${team.name}) to owner: ${team.goalkeeper_owner}`);
                    }

                    // Data to update for EXISTING players (only external info)
                    const updateData = {
                        ...baseData
                    };

                    // Data for NEW players (includes defaults)
                    const createData = {
                        ...baseData,
                        quotation: 0,
                        purchase_price: 0,
                        owner: null
                    };

                    try {
                        // Try to update only the safe fields
                        await db.updateDocument(DATABASE_ID, PLAYERS_COLLECTION_ID, docId, updateData);
                        syncedPlayers++;
                    } catch (err) {
                        if (err.code === 404) {
                            try {
                                // If not found, create with all defaults
                                await db.createDocument(DATABASE_ID, PLAYERS_COLLECTION_ID, docId, createData);
                                syncedPlayers++;
                            } catch (createErr) {
                                log(`Error creating ${member.name}: ${createErr.message}`);
                                errors++;
                            }
                        } else {
                            log(`Error updating ${member.name}: ${err.message}`);
                            errors++;
                        }
                    }
                }
            }
        } catch (err) {
            log(`Error fetching squad for ${team.name}: ${err.message}`);
            errors++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { success: true, action: 'SYNC_PLAYERS', teamsProcessed: teams.length, totalPlayers, syncedPlayers, errors };
}

// ============ UPDATE PLAYER ============
async function updatePlayer(db, log, data) {
    const { playerId, updates } = data;
    log(`Updating player ${playerId}...`);

    if (!playerId || !updates) throw new Error('Missing playerId or updates');

    // Filter allowed fields for security
    const allowed = ['position', 'quotation', 'purchase_price', 'owner'];
    const safeUpdates = {};

    Object.keys(updates).forEach(key => {
        if (allowed.includes(key)) {
            safeUpdates[key] = updates[key];
        }
    });

    if (Object.keys(safeUpdates).length === 0) throw new Error('No valid fields to update');

    await db.updateDocument(DATABASE_ID, PLAYERS_COLLECTION_ID, playerId, safeUpdates);

    return { success: true, action: 'UPDATE_PLAYER', playerId, updates: safeUpdates };
}

// ============ MAIN HANDLER ============
export default async ({ req, res, log, error }) => {
    log('=== sync_players v2 (Teams + Players) ===');

    if (!API_KEY) {
        error('APPWRITE_API_KEY is missing');
        return res.json({ success: false, error: 'Configuration Error' }, 500);
    }

    // Parse action from body
    let body = {};
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch (e) {
        body = {};
    }

    const action = body.action || 'SYNC_PLAYERS';
    log(`Action: ${action}`);

    const db = getDb();

    try {
        if (action === 'SYNC_TEAMS') {
            const result = await syncTeams(db, log);
            return res.json(result);
        }

        if (action === 'SYNC_PLAYERS') {
            const result = await syncPlayers(db, log);
            return res.json(result);
        }

        if (action === 'SYNC_ALL') {
            log('Running SYNC_ALL (Teams first, then Players)...');
            const teamsResult = await syncTeams(db, log);
            const playersResult = await syncPlayers(db, log);
            return res.json({
                success: true,
                action: 'SYNC_ALL',
                teams: teamsResult,
                players: playersResult
            });
        }

        if (action === 'UPDATE_PLAYER') {
            const result = await updatePlayer(db, log, body);
            return res.json(result);
        }

        return res.json({ success: false, error: `Unknown action: ${action}` }, 400);

    } catch (err) {
        error(`Sync failed: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
