import axios from 'axios';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League

const SHORT_NAMES = {
    'Wolverhampton Wanderers': 'Wolves',
    'Brighton & Hove Albion': 'Brighton',
    'Nottingham Forest': 'Forest',
    'Sheffield United': 'Sheff Utd',
    'West Ham United': 'West Ham',
    'Newcastle United': 'Newcastle',
    'Tottenham Hotspur': 'Tottenham',
    'Manchester United': 'Man Utd',
    'Manchester City': 'Man City',
    'Leicester City': 'Leicester',
    'Ipswich Town': 'Ipswich',
    'AFC Bournemouth': 'Bournemouth',
    'Crystal Palace': 'Palace',
    'Aston Villa': 'Villa'
};

const apiClient = axios.create({
    baseURL: FOTMOB_BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.fotmob.com/',
        'Accept': 'application/json'
    }
});

export default async ({ req, res, log, error }) => {
    log('=== get_pl_fixtures (Proxy) ===');

    // Parse request
    let params = {};
    try {
        if (typeof req.body === 'string' && req.body) {
            params = JSON.parse(req.body);
        } else if (req.body) {
            params = req.body;
        }
    } catch (e) {
        params = {};
    }

    const { gameweek, liveOnly, todayOnly } = params;
    log(`Filters: gameweek=${gameweek || 'all'}, liveOnly=${liveOnly}, todayOnly=${todayOnly}`);

    try {
        // Fetch from FotMob
        const response = await apiClient.get('/leagues', {
            params: { id: FOTMOB_LEAGUE_ID, tab: 'matches' }
        });

        const data = response.data;
        let allMatches = data.fixtures?.allMatches || data.matches?.allMatches || data.allMatches || [];

        log(`FotMob returned ${allMatches.length} matches.`);

        // Transform to our format
        const today = new Date().toISOString().split('T')[0];

        let fixtures = allMatches.map(m => {
            // Determine status
            let status = 'SCHEDULED';
            if (m.status) {
                if (m.status.finished) status = 'FINISHED';
                else if (m.status.started || m.status.live) status = 'IN_PLAY';
                else if (m.status.cancelled) status = 'POSTPONED';
            }

            // Parse score
            let homeScore = null;
            let awayScore = null;
            if (status === 'IN_PLAY' || status === 'FINISHED') {
                if (m.status?.scoreStr) {
                    const parts = m.status.scoreStr.split('-');
                    if (parts.length === 2) {
                        homeScore = parseInt(parts[0].trim()) || 0;
                        awayScore = parseInt(parts[1].trim()) || 0;
                    }
                }
            }

            // Get minute
            let minute = null;
            if (m.status?.liveTime?.short) {
                minute = m.status.liveTime.short;
            } else if (m.status?.liveTime) {
                minute = String(m.status.liveTime);
            }

            return {
                id: m.id,
                gameweek: parseInt(m.round) || 0,
                date: m.status?.utcTime || m.time,
                status: status,
                minute: minute,
                home: {
                    id: m.home?.id,
                    name: m.home?.name,
                    shortName: SHORT_NAMES[m.home?.name] || m.home?.shortName || m.home?.name?.substring(0, 10),
                    logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home?.id}.png`
                },
                away: {
                    id: m.away?.id,
                    name: m.away?.name,
                    shortName: SHORT_NAMES[m.away?.name] || m.away?.shortName || m.away?.name?.substring(0, 10),
                    logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away?.id}.png`
                },
                homeScore: homeScore,
                awayScore: awayScore
            };
        });

        // Apply filters
        if (gameweek) {
            fixtures = fixtures.filter(f => f.gameweek === parseInt(gameweek));
        }

        if (liveOnly) {
            fixtures = fixtures.filter(f => f.status === 'IN_PLAY');
        }

        if (todayOnly) {
            fixtures = fixtures.filter(f => f.date && f.date.startsWith(today));
        }

        log(`Returning ${fixtures.length} fixtures after filtering.`);

        return res.json({
            success: true,
            count: fixtures.length,
            fixtures: fixtures
        });

    } catch (err) {
        error(`FotMob Error: ${err.message}`);
        return res.json({ success: false, error: err.message }, 500);
    }
};
