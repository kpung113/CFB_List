// fetcher.js - Responsible for fetching live schedules, scores, TV networks, and records from ESPN APIs

const ESPN_SCHEDULE_ENDPOINTS = {
  football: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/344/schedule?limit=100',
  'mens-basketball': 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/344/schedule?limit=100',
  'womens-basketball': 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/344/schedule?limit=100',
  baseball: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/344/schedule?limit=100',
  softball: 'https://site.api.espn.com/apis/site/v2/sports/softball/college-softball/teams/344/schedule?limit=100'
};

function parseScore(scoreObj) {
  if (scoreObj == null) return null;
  if (typeof scoreObj !== 'object') return String(scoreObj);
  return scoreObj.value !== undefined ? String(scoreObj.value) : scoreObj.displayValue !== undefined ? String(scoreObj.displayValue) : null;
}

function parseNetworkFromCompetition(comp) {
  if (!comp) return '';
  const broadcastList = comp.broadcasts || [];
  for (const b of broadcastList) {
    if (b.media?.shortName) return b.media.shortName;
    if (b.names && b.names.length) return b.names.join(' / ');
  }
  return '';
}

async function fetchLiveSchedules() {
  const liveEventsMap = new Map();
  // Store computed records per sport: { overall: '5-2', sec: '2-2' }
  const sportRecordsMap = {};

  const fetchPromises = Object.entries(ESPN_SCHEDULE_ENDPOINTS).map(async ([sportKey, url]) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const events = data.events || data.team?.schedule || [];

      let wins = 0, losses = 0;
      let secWins = 0, secLosses = 0;

      events.forEach(event => {
        const comp = event.competitions?.[0];
        if (!comp) return;

        const msu = comp.competitors?.find(c => String(c.id || c.team?.id) === '344');
        const opp = comp.competitors?.find(c => String(c.id || c.team?.id) !== '344');
        if (!msu || !opp) return;

        const isoDate = event.date ? event.date.split('T')[0] : '';
        if (!isoDate) return;

        // Check if SEC game (either opponent notes conference game or conference name check)
        const isSecGame = comp.conferenceCompetition === true || 
                          (event.notes && event.notes.some(n => n.headline?.toLowerCase().includes('sec')));

        const tv = parseNetworkFromCompetition(comp);
        
        let result = '';
        const status = event.status?.type;
        const isCompleted = status?.completed === true || status?.state === 'post';

        if (isCompleted) {
          const mScore = parseScore(msu.score);
          const oScore = parseScore(opp.score);
          if (mScore !== null && oScore !== null) {
            const win = msu.winner ?? (parseInt(mScore, 10) > parseInt(oScore, 10));
            result = `${win ? 'W' : 'L'} ${mScore}-${oScore}`;

            // Tally records
            if (win) {
              wins++;
              if (isSecGame) secWins++;
            } else {
              losses++;
              if (isSecGame) secLosses++;
            }
          }
        } else if (status?.state === 'in') {
          result = `LIVE ${parseScore(msu.score) || 0}-${parseScore(opp.score) || 0}`;
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
          result,
          isSec: isSecGame
        });
      });

      sportRecordsMap[sportKey] = {
        overall: `${wins}-${losses}`,
        sec: `${secWins}-${secLosses}`
      };

    } catch (err) {
      console.warn(`Failed fetching live data for ${sportKey}:`, err);
    }
  });

  await Promise.all(fetchPromises);
  return { liveEventsMap, sportRecordsMap };
}
