import { Client, Account, Databases } from 'appwrite';

const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
    console.error("Appwrite Endpoint or Project ID missing in .env");
}

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);

// Constants for DB IDs (We'll use standard names)
export const DB_ID = 'fantapl_db';
export const COLL_SETTINGS = 'app_settings';
export const COLL_TEAMS = 'real_teams';
export const COLL_PLAYERS = 'players';
export const COLL_FIXTURES = 'fixtures';
export const COLL_PERFORMANCES = 'performances';
