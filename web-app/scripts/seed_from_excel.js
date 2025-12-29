import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIG ---
const DB_ID = 'fantapl_db';
const COLL_TEAMS = 'real_teams';
const COLL_PLAYERS = 'players';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE_PATH = path.resolve(__dirname, '../../Listone e Lista Rose 25-26.xlsx');

// Appwrite Setup
const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Role Mapping
const ROLE_MAP = {
    'Portieri': 'GK',
    'Difensori': 'DEF',
    'Centrocampisti': 'MID',
    'Attaccanti': 'ATT'
};

/*
    EXCEL STRUCTURE (Based on Row 3 headers)
    Index 0: Tag (Fantasy Manager) - IGNORING ASSIGNMENT AS REQUESTED
    Index 1: Ruolo (Portieri, Difensori...)
    Index 2: Nome (Player Name)
    Index 3: Squadra (Real Team Name)
    Index 4: Quotazione
*/

async function seed() {
    try {
        console.log("Reading Excel...");
        const workbook = XLSX.readFile(FILE_PATH);
        const sheet = workbook.Sheets['Listone'];
        // Start reading from Row 3 (Headers) to capture everything below
        // Actually we know data starts at Row 4 (index 4 of array if we include headers? No, range works differently)
        // Let's us sheet_to_json with explicit range to be safe

        // range: 3 means start at Row 4 (0-indexed 3)
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3 });

        // now rows[0] is headers: ["Tag", "Ruolo", ...]
        // rows[1] is first data: ["Nicolò", "Portieri", "Raya...", "Arsenal"...]

        const dataRows = rows.slice(1).filter(r => r.length > 0 && r[2] && r[3]); // Must have Name and Team
        console.log(`Found ${dataRows.length} players to import.`);

        // 1. UNIQUE TEAMS
        const uniqueTeams = [...new Set(dataRows.map(r => r[3]).filter(t => t))].sort();
        console.log(`Found ${uniqueTeams.length} unique teams:`, uniqueTeams.join(', '));

        const teamMap = {}; // Name -> ID

        console.log("Syncing Teams...");
        for (const teamName of uniqueTeams) {
            // Check if exists
            const existing = await databases.listDocuments(DB_ID, COLL_TEAMS, [
                Query.equal('name', teamName)
            ]);

            if (existing.documents.length > 0) {
                teamMap[teamName] = existing.documents[0].$id;
            } else {
                // Create
                const doc = await databases.createDocument(DB_ID, COLL_TEAMS, ID.unique(), {
                    name: teamName,
                    short_name: teamName.substring(0, 3).toUpperCase(),
                    logo_url: null // Can fill later
                });
                teamMap[teamName] = doc.$id;
                console.log(`Created Team: ${teamName}`);
            }
        }

        // 2. PLAYERS
        console.log("Syncing Players...");
        let createdCount = 0;

        // Optimize: Fetch all existing players to avoid N queries? 
        // Or just fire away. Appwrite allows ~60 req/s. We have ~500 players.
        // Let's do batch or sequential. Sequential is safer for script.

        for (const row of dataRows) {
            const rawRole = row[1];
            const name = row[2];
            const teamName = row[3];

            const role = ROLE_MAP[rawRole] || 'MID'; // Default to MID if weird
            const teamId = teamMap[teamName];
            const isGkBlock = role === 'GK';

            if (!teamId) {
                console.warn(`Skipping ${name}: Team ${teamName} not found mapped.`);
                continue;
            }

            // Check duplicate by Name + Team
            const existing = await databases.listDocuments(DB_ID, COLL_PLAYERS, [
                Query.equal('name', name),
                Query.equal('real_team_id', teamId)
            ]);

            if (existing.documents.length === 0) {
                await databases.createDocument(DB_ID, COLL_PLAYERS, ID.unique(), {
                    name: name,
                    role: role,
                    real_team_id: teamId,
                    is_gk_block: isGkBlock
                });
                process.stdout.write('.');
                createdCount++;
            }
        }

        console.log(`\nImport Complete! Created ${createdCount} new players.`);

    } catch (e) {
        console.error("Seed Failed:", e);
    }
}

seed();
