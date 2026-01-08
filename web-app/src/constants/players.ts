/**
 * Player Constants - Shared across components
 * 
 * Single source of truth for player-related display constants
 */

/**
 * Available player roles
 */
export const ROLES = ['Portiere', 'Difensore', 'Centrocampista', 'Attaccante'] as const;

/**
 * Roles with "All" option for filters
 */
export const ROLES_WITH_ALL = ['Tutti', ...ROLES] as const;

/**
 * Role sort order (GK first, then DEF, MID, ATT)
 */
export const ROLE_ORDER: Record<string, number> = {
    'Portiere': 1,
    'Difensore': 2,
    'Centrocampista': 3,
    'Attaccante': 4,
    'Unknown': 5,
};

/**
 * Role abbreviations for display
 */
export const ROLE_ABBR: Record<string, string> = {
    'Portiere': 'P',
    'Difensore': 'D',
    'Centrocampista': 'C',
    'Attaccante': 'A',
    'Unknown': '?',
};

/**
 * Tailwind color classes for each role
 */
export const ROLE_COLORS: Record<string, string> = {
    'Portiere': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'Difensore': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Centrocampista': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Attaccante': 'bg-red-500/20 text-red-400 border-red-500/30',
};

/**
 * Required player counts for a complete squad
 */
export const REQUIRED_COUNTS = { P: 2, D: 8, C: 8, A: 6 };

/**
 * Total required players
 */
export const TOTAL_REQUIRED = Object.values(REQUIRED_COUNTS).reduce((a, b) => a + b, 0);
