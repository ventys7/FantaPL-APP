export interface AppwriteDocument {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $collectionId: string;
    $databaseId: string;
}

export type UserRole = 'admin' | 'helper' | 'user' | 'g_admin';

export interface User {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    name: string;
    email: string;
    phone: string;
    emailVerification: boolean;
    phoneVerification: boolean;
    status: boolean;
    labels: string[];
    prefs: {
        role?: UserRole;
        teamId?: string;
        avatar?: string;
        force_pass_reset?: boolean;
        hidden?: boolean;
    };
}

export interface Team extends AppwriteDocument {
    name: string;
    short_name: string;
    logo_url?: string;
    external_id?: number;
}

export interface Fixture extends AppwriteDocument {
    comp_id: number;
    home_team_id: string;
    away_team_id: string;
    home_score: number | null;
    away_score: number | null;
    date: string;
    status: string;
    minute: number | null;
    gameweek: number;
    season: number;
    external_id: number;
    lineups?: string; // JSON string
}
