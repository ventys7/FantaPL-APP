import { AppwriteDocument } from './shared';

// Re-export Player from unified source
export type { Player, RealTeam, PlayerPosition } from './player';

export interface Team extends AppwriteDocument {
    name: string;
    short_name: string;
    logo_url?: string;
}


export interface Fixture extends AppwriteDocument {
    gameweek: number;
    home_team_id: string;
    away_team_id: string;
    home_score?: number;
    away_score?: number;
    finished: boolean;
    // Expanded fields (optional)
    home_team?: Team;
    away_team?: Team;
}

export interface Performance extends AppwriteDocument {
    fixture_id: string;
    player_id: string;
    minutes_played: number;
    vote_base: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    pen_scored: number;
    pen_missed: number;
    pen_saved: number;
    clean_sheet: boolean;
    own_goals: number;
    // Expanded
    player?: Player;
}

export interface AppSettings extends AppwriteDocument {
    key: string;
    value: string;
    description?: string;
}
