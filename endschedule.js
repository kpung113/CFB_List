// schedule-store.js - Merges baseline data.js with live fetcher.js data into a unified reference set

let cachedUnifiedDataset = null;

async function getUnifiedSchedule() {
  if (cachedUnifiedDataset) return cachedUnifiedDataset;

  // 1. Start with a clone of the baseline hardcoded dataset
  let dataset = typeof masterDataset !== 'undefined' ? JSON.parse(JSON.stringify(masterDataset)) : [];

  // 2. Fetch live updates from the API fetcher
  let liveMap = new Map();
  try {
    if (typeof fetchLiveSchedules === 'function') {
      liveMap = await fetchLiveSchedules();
    }
  } catch (err) {
    console.warn('Live schedule fetch failed, falling back purely to baseline data:', err);
  }

  // 3. Merge or override baseline data with live data
  liveMap.forEach((liveGame, lookupKey) => {
    const [sportKey, isoDate] = lookupKey.split('|');
    const existingIndex = dataset.findIndex(d => d.sportKey === sportKey && d.isoDate === isoDate);

    if (existingIndex !== -1) {
      // Update existing baseline entry with live scores, times, networks, and venues
      if (liveGame.result) dataset[existingIndex].result = liveGame.result;
      if (liveGame.network) dataset[existingIndex].network = liveGame.network;
      if (liveGame.timeStr && liveGame.timeStr !== 'TBD') dataset[existingIndex].timeStr = liveGame.timeStr;
      if (liveGame.location) dataset[existingIndex].location = liveGame.location;
    } else {
      // If ESPN has a game not present in baseline data.js, push it dynamically
      dataset.push(liveGame);
    }
  });

  // Sort chronological
  dataset.sort((a, b) => {
    const aDate = new Date(`${a.isoDate}T00:00:00`).getTime();
    const bDate = new Date(`${b.isoDate}T00:00:00`).getTime();
    if (aDate !== bDate) return aDate - bDate;
    return (a.timeStr || '').localeCompare(b.timeStr || '');
  });

  cachedUnifiedDataset = dataset;
  return cachedUnifiedDataset;
}
