// endschedule.js - Robust Fail-Safe & Deduplicating Merger

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/golden eagles|demons|tigers|lions|bulldogs|volunteers|commodores|wildcats|razorbacks|gators|crimson tide|gamecocks|aggies|longhorns|rebels/g, '')
    .trim();
}

async function getUnifiedSchedule() {
  let staticData = [];
  let apiData = [];

  // 1. Safely load static baseline data
  if (typeof BASELINE_SCHEDULE !== 'undefined' && Array.isArray(BASELINE_SCHEDULE)) {
    staticData = BASELINE_SCHEDULE;
  }

  // 2. Safely attempt to fetch live API data
  if (typeof fetchLiveSchedules === 'function') {
    try {
      const res = await fetchLiveSchedules();
      if (Array.isArray(res)) {
        apiData = res;
      }
    } catch (err) {
      console.warn("Live API fetch failed, falling back to static baseline:", err);
    }
  }

  // If live API returns no items, return static baseline immediately
  if (!apiData.length) {
    return staticData;
  }

  const seenGames = new Set();
  const unified = [];

  // 3. Process Live API Data (Highest Priority)
  apiData.forEach(game => {
    if (!game) return;
    const dateKey = game.isoDate || game.date || 'tbd';
    const key = `${game.sportKey || 'sport'}_${dateKey}_${normalizeTeamName(game.opponent)}`;
    seenGames.add(key);
    unified.push(game);
  });

  // 4. Merge Static Baseline Games ONLY if not already provided by API
  staticData.forEach(game => {
    if (!game) return;
    const dateKey = game.isoDate || game.date || 'tbd';
    const key = `${game.sportKey || 'sport'}_${dateKey}_${normalizeTeamName(game.opponent)}`;
    
    // Also check if a game against this team exists on an adjacent baseline date
    const teamOnlyKey = `${game.sportKey || 'sport'}_${normalizeTeamName(game.opponent)}`;
    const hasApiMatchForTeam = Array.from(seenGames).some(k => k.startsWith(teamOnlyKey));

    if (!seenGames.has(key) && !hasApiMatchForTeam) {
      unified.push(game);
    }
  });

  return unified;
}
