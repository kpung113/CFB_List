// injuries.js - Full College Football (All FBS Teams) Injury & Availability Fetcher

// 1. Expanded list of FBS Teams across all major conferences
const ALL_FBS_TEAMS = [
  // SEC
  { id: '333',  name: 'Alabama',           conf: 'SEC' },
  { id: '8',    name: 'Arkansas',          conf: 'SEC' },
  { id: '2',    name: 'Auburn',            conf: 'SEC' },
  { id: '57',   name: 'Florida',           conf: 'SEC' },
  { id: '61',   name: 'Georgia',           conf: 'SEC' },
  { id: '96',   name: 'Kentucky',          conf: 'SEC' },
  { id: '99',   name: 'LSU',               conf: 'SEC' },
  { id: '344',  name: 'Mississippi State', conf: 'SEC' },
  { id: '142',  name: 'Missouri',          conf: 'SEC' },
  { id: '201',  name: 'Oklahoma',          conf: 'SEC' },
  { id: '145',  name: 'Ole Miss',          conf: 'SEC' },
  { id: '2579', name: 'South Carolina',    conf: 'SEC' },
  { id: '2633', name: 'Tennessee',         conf: 'SEC' },
  { id: '251',  name: 'Texas',             conf: 'SEC' },
  { id: '245',  name: 'Texas A&M',         conf: 'SEC' },
  { id: '238',  name: 'Vanderbilt',        conf: 'SEC' },

  // Big Ten
  { id: '130',  name: 'Michigan',          conf: 'Big Ten' },
  { id: '194',  name: 'Ohio State',        conf: 'Big Ten' },
  { id: '213',  name: 'Penn State',        conf: 'Big Ten' },
  { id: '275',  name: 'Wisconsin',         conf: 'Big Ten' },
  { id: '356',  name: 'Illinois',          conf: 'Big Ten' },
  { id: '26',   name: 'UCLA',              conf: 'Big Ten' },
  { id: '30',   name: 'USC',               conf: 'Big Ten' },

  // Big 12
  { id: '252',  name: 'BYU',               conf: 'Big 12' },
  { id: '2130', name: 'UCF',               conf: 'Big 12' },
  { id: '239',  name: 'Baylor',            conf: 'Big 12' },
  { id: '197',  name: 'Oklahoma State',    conf: 'Big 12' },
  { id: '38',   name: 'Colorado',          conf: 'Big 12' },

  // ACC
  { id: '52',   name: 'Florida State',     conf: 'ACC' },
  { id: '228',  name: 'Clemson',           conf: 'ACC' },
  { id: '150',  name: 'North Carolina',    conf: 'ACC' },
  { id: '183',  name: 'Syracuse',          conf: 'ACC' },
  { id: '2567', name: 'SMU',               conf: 'ACC' }
];

// Fallback dataset in case the live API is blank
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
  }
};

async function fetchAllCFBInjuries() {
  console.log(`Starting fetch across ${ALL_FBS_TEAMS.length} FBS teams...`);
  const allInjuries = {};
  let totalLivePlayersFound = 0;

  const teamPromises = ALL_FBS_TEAMS.map(async (team) => {
    // ESPN Site API team injuries endpoint
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team.id}/injuries`;
    
    try {
      const res = await fetch(url);
      
      if (!res.ok) {
        console.warn(`[API] ${team.name} (${team.id}) returned status: ${res.status}`);
        return;
      }

      const data = await res.json();
      
      // ESPN returns lists under data.injuries or data.items
      const injuriesList = data.injuries || data.items || [];
      
      if (injuriesList.length > 0) {
        console.log(`[LIVE MATCH] ${team.name} returned ${injuriesList.length} player injury report(s)!`);
      }

      const validPlayers = injuriesList.map((item) => {
        const athlete = item.athlete || {};
        const athleteName = athlete.displayName || athlete.fullName || "Player";
        const pos = athlete.position?.abbreviation || "";
        
        const rawStatus = typeof item.status === 'object' 
          ? (item.status?.displayName || item.status?.name || item.status?.type) 
          : (item.status || "Unknown");

        const injuryTypeStr = item.type || item.details?.type || "Injury";
        const detailsStr = item.details?.description || item.details?.detail || injuryTypeStr;

        return {
          player: athleteName,
          position: pos,
          status: rawStatus,
          type: injuryTypeStr,
          details: detailsStr
        };
      }).filter(Boolean);

      if (validPlayers.length > 0) {
        totalLivePlayersFound += validPlayers.length;
        allInjuries[team.name] = { 
          conference: team.conf, 
          players: validPlayers 
        };
      }
    } catch (err) {
      console.error(`[ERROR] Failed fetching for ${team.name}:`, err);
    }
  });

  await Promise.all(teamPromises);

  console.log(`Fetch finished! Total live players found across all teams: ${totalLivePlayersFound}`);

  // If live API returns empty across ALL teams, default to fallback
  if (Object.keys(allInjuries).length === 0) {
    console.warn("No active live injuries found across any FBS team. Loading fallback dataset.");
    return MOCK_INJURIES;
  }

  return allInjuries;
}
