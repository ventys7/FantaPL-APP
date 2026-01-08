/**
 * MatchSheet Types
 * TypeScript interfaces for the MatchSheet component
 */

export interface LineupPlayer {
    id: number;
    name: string;
    number: number;
    position: string;
    image: string | null;
    grid: string | null;
}

export interface MatchEvent {
    type: 'Goal' | 'OwnGoal' | 'Card' | 'SubIn' | 'SubOut' | 'Assist' | 'PenaltyMissed' | 'PenaltySaved';
    detail?: string;
    secondYellow?: boolean;
    isHome?: boolean;
    time: {
        elapsed: number;
        extra?: number;
    };
    player?: {
        id: number;
        name: string;
    };
    team?: {
        name: string;
    };
}

export interface TeamLineup {
    formation: string;
    lineup: LineupPlayer[];
    bench: LineupPlayer[];
}

export interface LineupsData {
    home: TeamLineup | null;
    away: TeamLineup | null;
    events: MatchEvent[];
    meta: {
        totalDuration: number;
    };
}

export interface FantasyPlayerData {
    role: string | null;
    owner: string | null;
}

// Role color styles
export const ROLE_STYLES: Record<string, string> = {
    'Portiere': 'text-yellow-500',
    'Difensore': 'text-blue-500',
    'Centrocampista': 'text-green-500',
    'Attaccante': 'text-red-500',
};

export const getRoleStyle = (role: string): string => {
    return ROLE_STYLES[role] || 'text-gray-500';
};
