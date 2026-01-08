import { Client, Account, Databases, Storage, Functions } from 'appwrite';
import { logger } from './logger';

export const client = new Client();

// Use environment variables for credentials
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '6952ee8b000ce55dc6bc';

logger.debug('[Appwrite] Initializing with:', { endpoint, projectId });

client
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Constants for DB IDs
export const DB_ID = 'fantapl_db';
export const COLL_SETTINGS = 'app_settings';
export const COLL_TEAMS = 'real_teams';
export const COLL_PLAYERS = 'players';
export const COLL_FIXTURES = 'fixtures';
export const COLL_PERFORMANCES = 'performances';
export const COLL_FANTASY_TEAMS = 'fantasy_teams';
export const COLL_ARCHIVE = 'rules_archive';
export const COLL_TRADE_PROPOSALS = 'trade_proposals';
export const BUCKET_LOGOS = 'team_logos';
