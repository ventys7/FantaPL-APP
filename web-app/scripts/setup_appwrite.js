import { Client, Databases, Permission, Role, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_NAME = 'fantapl_db';

// Schema Definitions
const ATTRIBUTES = {
    app_settings: [
        { key: 'key', type: 'string', size: 255, required: true },
        { key: 'value', type: 'string', size: 1000, required: true }, // Storing value as string/JSON
        { key: 'description', type: 'string', size: 1000, required: false },
        // Rules section fields
        { key: 'cenni_main_text', type: 'string', size: 100000, required: false },
        { key: 'cenni_partecipanti', type: 'string', size: 10000, required: false },
        { key: 'sections_json', type: 'string', size: 500000, required: false }
    ],
    real_teams: [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'short_name', type: 'string', size: 10, required: true },
        { key: 'logo_url', type: 'url', required: false }
    ],
    players: [
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'role', type: 'string', size: 10, required: true }, // GK, DEF...
        { key: 'real_team_id', type: 'string', size: 255, required: true }, // Rel ID
        { key: 'is_gk_block', type: 'boolean', required: false, default: false }
    ],
    fixtures: [
        { key: 'gameweek', type: 'integer', required: true },
        { key: 'home_team_id', type: 'string', size: 255, required: true },
        { key: 'away_team_id', type: 'string', size: 255, required: true },
        { key: 'home_score', type: 'integer', required: false },
        { key: 'away_score', type: 'integer', required: false },
        { key: 'finished', type: 'boolean', required: false, default: false }
    ],
    performances: [
        { key: 'fixture_id', type: 'string', size: 255, required: true },
        { key: 'player_id', type: 'string', size: 255, required: true },
        { key: 'minutes_played', type: 'integer', required: false, default: 0 },
        { key: 'vote_base', type: 'double', required: false }, // Float
        { key: 'goals', type: 'integer', required: false, default: 0 },
        { key: 'assists', type: 'integer', required: false, default: 0 },
        { key: 'yellow_cards', type: 'integer', required: false, default: 0 },
        { key: 'red_cards', type: 'integer', required: false, default: 0 },
        { key: 'pen_scored', type: 'integer', required: false, default: 0 },
        { key: 'pen_missed', type: 'integer', required: false, default: 0 },
        { key: 'pen_saved', type: 'integer', required: false, default: 0 },
        { key: 'clean_sheet', type: 'boolean', required: false, default: false },
        { key: 'own_goals', type: 'integer', required: false, default: 0 }
    ],
    rules_archive: [
        { key: 'season', type: 'string', size: 20, required: true }, // e.g. "2024/25"
        { key: 'archived_at', type: 'datetime', required: true },
        { key: 'cenni_main_text', type: 'string', size: 100000, required: false },
        { key: 'cenni_partecipanti', type: 'string', size: 10000, required: false },
        { key: 'sections_json', type: 'string', size: 500000, required: false }
    ]
};

async function setup() {
    try {
        console.log('Connecting to Appwrite...');

        // 1. Create Database
        try {
            await databases.get(DB_NAME);
            console.log(`Database '${DB_NAME}' already exists.`);
        } catch (e) {
            console.log(`Creating database '${DB_NAME}'...`);
            await databases.create(DB_NAME, DB_NAME, true); // enabled=true
        }

        // 2. Create Collections & Attributes
        for (const [collName, attrs] of Object.entries(ATTRIBUTES)) {
            try {
                await databases.getCollection(DB_NAME, collName);
                console.log(`Collection '${collName}' already exists. Skipping creation.`);
                // In production we would check attributes differences, but for setup we assume clean or skip
            } catch (e) {
                console.log(`Creating collection '${collName}'...`);
                // Create with "Any" permissions for now to allow Demo (Read/Write for Any)
                // In prod restricted to Users/Admins
                await databases.createCollection(
                    DB_NAME,
                    collName,
                    collName,
                    [Permission.read(Role.any()), Permission.write(Role.any()), Permission.update(Role.any())]
                );

                // Add Attributes
                console.log(`Adding attributes to '${collName}'...`);
                for (const attr of attrs) {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DB_NAME, collName, attr.key, attr.size, attr.required, undefined, attr.array);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(DB_NAME, collName, attr.key, attr.required, undefined, undefined, attr.default);
                    } else if (attr.type === 'double') {
                        await databases.createFloatAttribute(DB_NAME, collName, attr.key, attr.required, undefined, undefined, attr.default);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(DB_NAME, collName, attr.key, attr.required, undefined, attr.default);
                    } else if (attr.type === 'url') {
                        await databases.createUrlAttribute(DB_NAME, collName, attr.key, attr.required, undefined, attr.default);
                    }
                    // Wait a bit to ensure attr creation is processed before next (Appwrite rate limits/async)
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        }

        console.log('Setup Complete!');

        // 3. Seed Rules
        console.log('Seeding initial rules...');
        const initialRules = [
            { key: 'scoring_goal_bonus', value: '3' },
            { key: 'scoring_assist_bonus', value: '1' },
            { key: 'regulation_switch_enabled', value: 'true' }
        ];

        for (const rule of initialRules) {
            try {
                // Check if exists
                const list = await databases.listDocuments(DB_NAME, 'app_settings', []);
                // Simple logic, just create if empty for now for speed
                await databases.createDocument(DB_NAME, 'app_settings', ID.unique(), rule);
            } catch (e) { }
        }

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setup();
