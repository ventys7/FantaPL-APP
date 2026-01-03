import { Client, Account, Databases, Storage, Functions } from 'appwrite';
import { logger } from './logger';

export const client = new Client();

// Hardcoded for debugging - replace with env vars once working
const endpoint = 'https://fra.cloud.appwrite.io/v1';
const projectId = '6952ee8b000ce55dc6bc';

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
export const BUCKET_LOGOS = 'team_logos';
