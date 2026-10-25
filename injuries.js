// injuries.js - Full College Football Injury & Availability Fetcher

const ALL_FBS_TEAMS = [
  // SEC
  { id: '333',  name: 'Alabama' },
  { id: '8',    name: 'Arkansas' },
  { id: '2',    name: 'Auburn' },
  { id: '57',   name: 'Florida' },
  { id: '61',   name: 'Georgia' },
  { id: '96',   name: 'Kentucky' },
  { id: '99',   name: 'LSU' },
  { id: '344',  name: 'Mississippi State' },
  { id: '142',  name: 'Missouri' },
  { id: '201',  name: 'Oklahoma' },
  { id: '145',  name: 'Ole Miss' },
  { id: '2579', name: 'South Carolina' },
  { id: '2633', name: 'Tennessee' },
  { id: '251',  name: 'Texas' },
  { id: '245',  name: 'Texas A&M' },
  { id: '238',  name: 'Vanderbilt' },

  // Big Ten
  { id: '130',  name: 'Michigan' },
  { id: '194',  name: 'Ohio State' },
  { id: '213',  name: 'Penn State' },
  { id: '275',  name: 'Wisconsin' },
  { id: '356',  name: 'Illinois' },
  { id: '26',   name: 'UCLA' },
  { id: '30',   name: 'USC' },

  // Big 12
  { id: '252',  name: 'BYU' },
  { id: '2130', name: 'UCF' },
  { id: '239',  name: 'Baylor' },
  { id: '197',  name: 'Oklahoma State' },
  { id: '38',   name: 'Colorado' },

  // ACC
  { id: '52',   name: 'Florida State' },
  { id: '228',  name: 'Clemson' },
  { id: '150',  name: 'North Carolina' },
  { id: '183',  name: 'Syracuse' },
  { id: '2567', name: 'SMU' }
];

// Fallback dataset (guarantees UI always renders)
const MOCK_INJURIES = {
  "Mississippi State": {
    players: [
      { player: "Blake Shapen", position: "QB", status: "Out", type: "Shoulder", details: "Shoulder" },
      { player: "Kevin Coleman Jr.", position: "WR", status: "Questionable", type: "Ankle", details: "Ankle" }
    ]
  },
  "Georgia": {
    players: [
      { player: "Roderick Robinson II", position: "RB", status: "Out", type: "Toe", details: "Toe" }
    ]
  },
  "Texas": {
    players: [
      { player: "Quinn Ewers", position: "QB", status: "Questionable", type: "Abdomen", details: "Abdomen" }
    ]
  }
};

function showMobileDebugBanner(teamsFound, totalPlayers) {
  let banner = document.getElementById('mobile-debug-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'mobile-debug-banner';
    banner.style.cssText = 'background:#181920; color:#38bdf8; font-size:0.75rem; font-weight:700; padding:8px 12px; text-align:center; border:1px solid #272935; margin-bottom:12px; border-radius:6px;';
    const container = document.getElementById('games-container') || document.body;
    container.prepend(banner);
  }
  
  if (teamsFound > 0) {
    banner.style.color = '#84cc16';
    banner.innerText = `🟢 LIVE API SUCCESS: ${totalPlayers} player(s) found across ${teamsFound} team(s).`;
  } else {
    banner.style.color = '#eab308';
    banner.innerText = `🟡 LIVE API EMPTY: Displaying Fallback Data.`;
  }
}

async function fetchAllCFBInjuries() {
  const allInjuries = {};
  let totalLivePlayersFound = 0;
  let liveTeamsFound = 0;

  try {
    const teamPromises = ALL_FBS_TEAMS.map(async (team) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team.id}/injuries`;
      
      try {
        const res = await fetch(url);
        if (!res.ok) return;

        const data = await res.json();
        const injuriesList = data.injuries || data.items || [];
        if (!Array.isArray(injuriesList) || injuriesList.length === 0) return;

        const validPlayers = injuriesList.map((item) => {
          const athlete = item.athlete || {};
          return {
            player: athlete.displayName || athlete.fullName || "Player",
            position: athlete.position?.abbreviation || "",
            status: typeof item.status === 'object' ? (item.status.displayName || item.status.name || "Unknown") : (item.status || "Unknown"),
            type: item.type || "Injury",
            details: item.details?.description || item.type || "Injury"
          };
        }).filter(Boolean);

        if (validPlayers.length > 0) {
          totalLivePlayersFound += validPlayers.length;
          liveTeamsFound++;
          // Matches standard structure expected by your UI renderer:
          allInjuries[team.name] = { players: validPlayers };
        }
      } catch (err) {
        // Individual team fetch failed
      }
    });

    await Promise.all(teamPromises);
  } catch (err) {
    console.warn("Error during API fetch loop:", err);
  }

  showMobileDebugBanner(liveTeamsFound, totalLivePlayersFound);

  // If live API returns 0 players across all teams, cleanly return MOCK_INJURIES
  if (Object.keys(allInjuries).length === 0) {
    return MOCK_INJURIES;
  }

  return allInjuries;
}

// Alias so older SEC-specific script calls in your HTML won't throw undefined errors
const fetchAllSECInjuries = fetchAllCFBInjuries;
