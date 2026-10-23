// endschedule.js - Fixed Date-Aware Deduplicating Merger

function normalizeTeamName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/golden eagles|demons|tigers|lions|bulldogs|volunteers|commodores|wildcats|razorbacks|gators|crimson tide|gamecocks|aggies|longhorns|rebels/g, '')
    .trim();
}

async function getUnifiedSchedule() {
  const staticData = typeof BASELINE_SCHEDULE !== 'undefined' ? BASELINE_SCHEDULE : [];
  const apiData = typeof fetchLiveSchedules === 'function' ? await fetchLiveSchedules() : [];

  if (!apiData.length) return staticData;

  const seenGames = new Set();
  const unified = [];

  // 1. Process Live API Data First (Highest Priority)
  apiData.forEach(game => {
    // Key includes isoDate so repeat opponents on different dates are NOT dropped
    const key = `${game.sportKey}_${game.isoDate}_${normalizeTeamName(game.opponent)}`;
    seenGames.add(key);
    unified.push(game);
  });

  // 2. Add Static Baseline Games ONLY if not already provided by Live API
  staticData.forEach(game => {
    const key = `${game.sportKey}_${game.isoDate}_${normalizeTeamName(game.opponent)}`;
    if (!seenGames.has(key)) {
      unified.push(game);
    }
  });

  return unified;
}
