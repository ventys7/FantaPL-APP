import axios from 'axios';

// FotMob Configuration
const FOTMOB_BASE_URL = 'https://www.fotmob.com/api';
const FOTMOB_LEAGUE_ID = 47; // Premier League

home: {
    id: m.home?.id,
        name: m.home?.name,
            shortName: m.home?.shortName || m.home?.name,
                logo: `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home?.id}.png`
},
away: {
    id: m.away?.id,
        name: m.away?.name,
            shortName: m.away?.shortName || m.away?.name,
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
