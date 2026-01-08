/**
 * Player Types - Single Source of Truth
 * 
 * This file contains all player-related type definitions used across the app.
 */

import { AppwriteDocument } from './shared';

/**
 * Position as stored in Appwrite DB (Italian names)
 */
export type PlayerPosition = 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante';

/**
 * Position abbreviations for display
 */
export type PositionAbbreviation = 'P' | 'D' | 'C' | 'A';

/**
 * Full Player interface matching Appwrite schema
 * Used by usePlayers hook and player-related components
 */
export interface Player {
    $id: string;
    fotmob_id: string;
    name: string;
    team_id: string;
    team_name: string;
    team_short_name: string;
    position: PlayerPosition | string; // Allow string for flexibility
    image_url: string;
    quotation: number;
    purchase_price: number;
    owner: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Real Team metadata for GK blocks and team info
 */
export interface RealTeam {
    $id: string;
    name: string;
    short_name: string;
    logo_url?: string;
    goalkeeper_owner?: string | null;
    goalkeeper_quotation?: number | null;
    goalkeeper_purchase_price?: number | null;
}

/**
 * Maps Italian position names to abbreviations
 */
export const POSITION_MAP: Record<PlayerPosition, PositionAbbreviation> = {
    'Portiere': 'P',
    'Difensore': 'D',
    'Centrocampista': 'C',
    'Attaccante': 'A'
};

/**
 * Role order for sorting (GK first, then DEF, MID, ATT)
 */
export const ROLE_ORDER: Record<string, number> = {
    'Portiere': 1,
    'Difensore': 2,
    'Centrocampista': 3,
    'Attaccante': 4
};

/**
 * Get position abbreviation from full position name
 */
export function getPositionAbbr(position: string): PositionAbbreviation {
    return POSITION_MAP[position as PlayerPosition] || 'D';
}
