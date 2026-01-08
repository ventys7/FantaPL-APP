import { Client, Databases, Query } from 'node-appwrite';

const PROJECT_ID = process.env.APPWRITE_FUNCTION_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.DB_ID || 'fantapl_db';
const PLAYERS_COLLECTION_ID = process.env.COLL_PLAYERS || 'players';
const TEAMS_COLLECTION_ID = process.env.COLL_TEAMS || 'real_teams';

export default async ({ req, res, log, error }) => {
    log('=== reset_squads v1 ===');

    if (!API_KEY) {
        error('APPWRITE_API_KEY is missing');
        return res.json({ success: false, error: 'Configuration Error' }, 500);
    }

    const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
        .setProject(PROJECT_ID)
        .setKey(API_KEY);

    const db = new Databases(client);

    try {
        log('Starting squad reset...');

        // 1. Reset all players (owner and purchase_price only, keep quotation!)
        let offset = 0;
        let totalPlayersReset = 0;
        let hasMore = true;

        while (hasMore) {
            const playersRes = await db.listDocuments(DATABASE_ID, PLAYERS_COLLECTION_ID, [
                Query.limit(100),
                Query.offset(offset)
            ]);

            for (const doc of playersRes.documents) {
                await db.updateDocument(DATABASE_ID, PLAYERS_COLLECTION_ID, doc.$id, {
                    owner: null,
                    purchase_price: 0
                    // quotation NOT touched
                });
                totalPlayersReset++;
            }

            log(`Reset ${totalPlayersReset} players so far...`);
            offset += 100;
            hasMore = playersRes.documents.length === 100;
        }

        log(`Total players reset: ${totalPlayersReset}`);

        // 2. Reset all GK blocks (real_teams)
        const teamsRes = await db.listDocuments(DATABASE_ID, TEAMS_COLLECTION_ID, [
            Query.limit(50)
        ]);

        let totalTeamsReset = 0;
        for (const doc of teamsRes.documents) {
            await db.updateDocument(DATABASE_ID, TEAMS_COLLECTION_ID, doc.$id, {
                goalkeeper_owner: null,
                goalkeeper_purchase_price: 0
                // goalkeeper_quotation NOT touched
            });
            totalTeamsReset++;
        }

        log(`Total GK blocks reset: ${totalTeamsReset}`);
        log('Squad reset completed successfully!');

        return res.json({
            success: true,
            playersReset: totalPlayersReset,
            teamsReset: totalTeamsReset
        });

    } catch (err) {
        error(`Reset failed: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
