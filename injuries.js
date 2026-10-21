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

async function fetchAllSECInjuries() {
  console.log("Fetching SEC injury reports...");
  const secInjuries = {};

  const teamPromises = SEC_TEAMS.map(async (team) => {
    const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/teams/${team.id}/injuries`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) return;

      const playerDetails = await Promise.all(items.map(async (item) => {
        try {
          // Resolve the injury reference wrapper
          const injRes = await fetch(item.$ref.replace(/^http:/, 'https:'));
          const injData = await injRes.json();
          
          let athleteName = "Player";
          let pos = "";
          
          // Resolve the athlete sub-reference 
          if (injData.athlete?.$ref) {
            const athRes = await fetch(injData.athlete.$ref.replace(/^http:/, 'https:'));
            const athData = await athRes.json();
            athleteName = athData.displayName || athData.fullName || athleteName;
            pos = athData.position?.abbreviation || "";
          }

          // Format status safely (string or object property)
          const rawStatus = typeof injData.status === 'object' 
            ? (injData.status?.displayName || injData.status?.name || injData.status?.type) 
            : injData.status;

          // Format injury location/type (e.g., Knee, Ankle, Undisclosed)
          const injuryTypeStr = typeof injData.type === 'object' 
            ? (injData.type?.displayName || injData.type?.name || "Injury") 
            : (injData.type || "Injury");

          return {
            player: athleteName,
            position: pos,
            status: rawStatus || "Unknown",
            type: injuryTypeStr,
            details: injData.details?.side ? `${injData.details.side} ${injuryTypeStr}` : injuryTypeStr
          };
        } catch (e) {
          return null;
        }
      }));

      const validPlayers = playerDetails.filter(Boolean);
      if (validPlayers.length > 0) {
        secInjuries[team.name] = validPlayers;
      }
    } catch (err) {
      console.warn(`Failed fetching injuries for ${team.name}:`, err);
    }
  });

  await Promise.all(teamPromises);
  console.log("SEC Injury Fetch Complete!");
  console.dir(secInjuries, { depth: null });
  return secInjuries;
}

fetchAllSECInjuries();
