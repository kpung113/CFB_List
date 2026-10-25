// injuries.js - SEC Football Injury & Availability Fetcher

const SEC_TEAMS = [ 
  { id: '333',  name: 'Alabama',           abbrev: 'ALA'   }, 
  { id: '8',    name: 'Arkansas',          abbrev: 'ARK'   }, 
  { id: '2',    name: 'Auburn',            abbrev: 'AUB'   }, 
  { id: '57',   name: 'Florida',           abbrev: 'FLA'   }, 
  { id: '61',   name: 'Georgia',           abbrev: 'UGA'   }, 
  { id: '96',   name: 'Kentucky',          abbrev: 'UK'    }, 
  { id: '99',   name: 'LSU',               abbrev: 'LSU'   }, 
  { id: '344',  name: 'Mississippi State', abbrev: 'MSST'  }, 
  { id: '142',  name: 'Missouri',          abbrev: 'MIZZ'  }, 
  { id: '201',  name: 'Oklahoma',          abbrev: 'OU'    }, 
  { id: '145',  name: 'Ole Miss',          abbrev: 'OM'    }, 
  { id: '2579', name: 'South Carolina',    abbrev: 'SC'    }, 
  { id: '2633', name: 'Tennessee',         abbrev: 'TENN'  }, 
  { id: '251',  name: 'Texas',             abbrev: 'TEX'   }, 
  { id: '245',  name: 'Texas A&M',         abbrev: 'TAMU'  }, 
  { id: '238',  name: 'Vanderbilt',        abbrev: 'VANDY' } 
];

// Fallback data structure for non-gamedays / empty API windows
const MOCK_SEC_INJURIES = {
  "Mississippi State": {
    players: [
      { player: "Blake Shapen", position: "QB", status: "Out", type: "Shoulder", details: "Shoulder" },
      { player: "Kevin Coleman Jr.", position: "WR", status: "Questionable", type: "Ankle", details: "Ankle" }
    ]
  },
  "Georgia": {
    players: [
      { player: "Roderick Robinson II", position: "RB", status: "Out", type: "Toe", details: "Toe" },
      { player: "Trevor Etienne", position: "RB", status: "Probable", type: "Lower Body", details: "Lower Body" }
    ]
  },
  "Texas": {
    players: [
      { player: "Quinn Ewers", position: "QB", status: "Questionable", type: "Abdomen", details: "Abdomen" }
    ]
  }
};

async function fetchAllSECInjuries() {
  console.log("Fetching SEC injury reports via ESPN Site API...");
  const secInjuries = {};

  const teamPromises = SEC_TEAMS.map(async (team) => {
    // ESPN Site API team injuries endpoint (returns aggregated injury objects in 1 call)
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${team.id}/injuries`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      
      // Site API returns injuries nested under data.injuries or data.items
      const injuriesList = data.injuries || data.items || [];
      if (injuriesList.length === 0) return;

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
        secInjuries[team.name] = { players: validPlayers };
      }
    } catch (err) {
      console.warn(`Failed fetching injuries for ${team.name}:`, err);
    }
  });

  await Promise.all(teamPromises);

  // If live API returns empty across all teams, fall back cleanly
  if (Object.keys(secInjuries).length === 0) {
    console.warn("No active live API injuries found across SEC. Loading fallback dataset.");
    return MOCK_SEC_INJURIES;
  }

  console.log("SEC Injury Fetch Complete!");
  return secInjuries;
    }
