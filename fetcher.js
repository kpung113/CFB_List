// fetcher.js - Bulletproof multi-sport fetcher

// fetcher.js - Updated endpoints with correct parameters per sport
const ESPN_SCHEDULE_ENDPOINTS = {
  football: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/344/schedule?season=2026&seasontype=2&limit=100',
  'mens-basketball': 'https://site.web.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/344/schedule?season=2027&limit=100',
  'womens-basketball': 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams/344/schedule?season=2027&seasontype=2&limit=100',
  baseball: 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/344/schedule?season=2027&limit=100'
};


function showDebug(msg) {
  console.log(msg);
  try {
    const box = document.getElementById('debug-box');
    if (box) box.innerText += '\n' + msg;
  } catch (e) {}
}

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

function isMSUCompetitor(c) {
  if (!c) return false;
  const idStr = String(c.id || c.team?.id || '');
  const abbrev = String(c.team?.abbreviation || '').toUpperCase();
  return idStr === '344' || abbrev === 'MSST' || abbrev === 'MSU';
}

async function fetchLiveSchedules() {
  const liveEventsMap = new Map();
  const sportRecordsMap = {};

  showDebug("Starting ESPN multi-sport fetch...");

  const fetchPromises = Object.entries(ESPN_SCHEDULE_ENDPOINTS).map(async ([sportKey, url]) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        showDebug(`Err ${sportKey}: HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      
      let events = data.events || data.requestedSeason?.events || data.team?.schedule || data.schedule || [];
      showDebug(`${sportKey}: fetched ${events.length} events`);

      let wins = 0, losses = 0;
      let secWins = 0, secLosses = 0;

      events.forEach(event => {
        const comp = event.competitions?.[0];
        if (!comp) return;

        const competitors = comp.competitors || [];
        const msu = competitors.find(c => isMSUCompetitor(c));
        const opp = competitors.find(c => !isMSUCompetitor(c));

        if (!msu || !opp) return;

        const isoDate = event.date ? event.date.split('T')[0] : '';
        if (!isoDate) return;

        const isSecGame = comp.conferenceCompetition === true || 
                          (event.notes && event.notes.some(n => n.headline?.toLowerCase().includes('sec')));

        const tv = parseNetworkFromCompetition(comp);
        
        let result = '';
        const statusType = event.status?.type || {};
        const statusState = statusType.state || '';
        const statusName = statusType.name || '';
        
        const isCompleted = statusType.completed === true || 
                            statusState === 'post' || 
                            statusName.includes('FINAL') || 
                            statusName.includes('POST');

        const mScore = parseScore(msu.score);
        const oScore = parseScore(opp.score);

        if (isCompleted || (mScore !== null && oScore !== null && mScore !== "" && oScore !== "")) {
          if (mScore !== null && oScore !== null) {
            const win = msu.winner ?? (parseInt(mScore, 10) > parseInt(oScore, 10));
            result = `${win ? 'W' : 'L'} ${mScore}-${oScore}`;

            if (win) {
              wins++;
              if (isSecGame) secWins++;
            } else {
              losses++;
              if (isSecGame) secLosses++;
            }
          }
        } else if (statusState === 'in') {
          result = `LIVE ${mScore || 0}-${oScore || 0}`;
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
      showDebug(`Fetch exception (${sportKey}): ${err.message}`);
    }
  });

  await Promise.all(fetchPromises);
  showDebug("Fetch complete. Map size: " + liveEventsMap.size);
  return { liveEventsMap, sportRecordsMap };
}
