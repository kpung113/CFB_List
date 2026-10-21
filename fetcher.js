// fetcher.js - Responsible for fetching and parsing live schedules from ESPN APIs

const ESPN_SCHEDULE_ENDPOINTS = {
  football: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/344/schedule?limit=100',
  'mens-basketball': 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/344/schedule?limit=100',
  'womens-basketball': 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/344/schedule?limit=100',
  baseball: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/344/schedule?limit=100',
  softball: 'https://site.api.espn.com/apis/site/v2/sports/softball/college-softball/teams/344/schedule?limit=100'
};

async function fetchLiveSchedules() {
  const liveEventsMap = new Map();

  const fetchPromises = Object.entries(ESPN_SCHEDULE_ENDPOINTS).map(async ([sportKey, url]) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const events = data.events || data.team?.schedule || [];

      events.forEach(event => {
        const comp = event.competitions?.[0];
        if (!comp) return;

        const msu = comp.competitors?.find(c => String(c.id || c.team?.id) === '344');
        const opp = comp.competitors?.find(c => String(c.id || c.team?.id) !== '344');
        if (!msu || !opp) return;

        const isoDate = event.date ? event.date.split('T')[0] : '';
        if (!isoDate) return;

        // Extract broadcast TV channel
        const tv = comp.broadcasts?.[0]?.names?.[0] || comp.broadcasts?.[0]?.media?.shortName || '';
        
        // Extract game result / status
        let result = '';
        const status = event.status?.type;
        if (status?.completed || status?.state === 'post') {
          const mScore = msu.score?.value ?? msu.score;
          const oScore = opp.score?.value ?? opp.score;
          if (mScore !== undefined && oScore !== undefined) {
            const win = msu.winner ?? (parseInt(mScore, 10) > parseInt(oScore, 10));
            result = `${win ? 'W' : 'L'} ${mScore}-${oScore}`;
          }
        } else if (status?.state === 'in') {
          result = `LIVE ${msu.score?.value || 0}-${opp.score?.value || 0}`;
        }

        const dateObj = new Date(event.date);
        const timeStr = (!isNaN(dateObj) && event.timeValid !== false) 
          ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) 
          : 'TBD';

        const lookupKey = `${sportKey}|${isoDate}`;
        liveEventsMap.set(lookupKey, {
          sportKey,
          opponent: opp.team?.displayName || opp.team?.shortDisplayName || 'Opponent',
          isoDate,
          timeStr,
          isHome: msu.homeAway === 'home',
          location: comp.venue?.fullName || 'Location TBD',
          network: tv,
          result
        });
      });
    } catch (err) {
      console.warn(`Failed fetching live data for ${sportKey}:`, err);
    }
  });

  await Promise.all(fetchPromises);
  return liveEventsMap;
}
