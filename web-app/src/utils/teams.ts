export const TEAM_ABBREVIATIONS: { [key: string]: string } = {
    'Bournemouth': 'BOU',
    'Arsenal': 'ARS',
    'Aston Villa': 'AVL',
    'Brentford': 'BRE',
    'Brighton & Hove Albion': 'BHA',
    'Burnley': 'BUR',
    'Chelsea': 'CHE',
    'Crystal Palace': 'CRY',
    'Everton': 'EVE',
    'Fulham': 'FUL',
    'Leeds United': 'LEE',
    'Liverpool': 'LIV',
    'Manchester City': 'MCI',
    'Manchester United': 'MUN',
    'Newcastle United': 'NEW',
    'Nottingham Forest': 'NFO',
    'Sunderland': 'SUN',
    'Tottenham Hotspur': 'TOT',
    'West Ham United': 'WHU',
    'Wolverhampton Wanderers': 'WOL'
};

export const DESKTOP_OVERRIDES: { [key: string]: string } = {
    'Villa': 'Aston Villa',
    'Forest': 'Nottingham Forest',
    'Palace': 'Crystal Palace'
};

export const getMobileShortName = (name: string, shortName: string): string => {
    // Try to find by name first
    if (TEAM_ABBREVIATIONS[name]) return TEAM_ABBREVIATIONS[name];
    // Fallback: try to match partials if needed, or just use first 3 chars
    return shortName.substring(0, 3).toUpperCase();
};

export const getDesktopName = (shortName: string): string => {
    return DESKTOP_OVERRIDES[shortName] || shortName;
};
