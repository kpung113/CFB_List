// endschedule.js - Deduplicating Merger

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/golden eagles|demons|tigers|lions|bulldogs|volunteers|commodores|wildcats|razorbacks|gators|crimson tide|gamecocks|aggies|longhorns|rebels|volunteers/g, '')
    .trim();
}

async function getUnifiedSchedule() {
  const staticData = typeof BASELINE_SCHEDULE !== 'undefined' ? BASELINE_SCHEDULE : [];
  const apiData = typeof fetchLiveSchedules === 'function' ? await fetchLiveSchedules() : [];

  if (!apiData.length) return staticData;

  // Track unique keys using sportKey + normalized opponent name
  const seenGames = new Set();
  const unified = [];

  // 1. Process Live API Data First (Highest Priority)
  apiData.forEach(game => {
    const key = `${game.sportKey}_${normalizeTeamName(game.opponent)}`;
    seenGames.add(key);
    unified.push(game);
  });

  // 2. Add Static Baseline Games ONLY if not already provided by API
  staticData.forEach(game => {
    const key = `${game.sportKey}_${normalizeTeamName(game.opponent)}`;
    if (!seenGames.has(key)) {
      unified.push(game);
    }
  });

  return unified;
}
