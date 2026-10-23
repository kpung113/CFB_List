// endschedule.js - Merges baseline data.js with live fetcher.js scores, networks, and records

let cachedUnifiedDataset = null;
let cachedSportRecords = {};

async function getUnifiedSchedule() {
  if (cachedUnifiedDataset) return cachedUnifiedDataset;

  let dataset = typeof masterDataset !== 'undefined' ? JSON.parse(JSON.stringify(masterDataset)) : [];
  let liveMap = new Map();

  try {
    if (typeof fetchLiveSchedules === 'function') {
      const fetched = await fetchLiveSchedules();
      liveMap = fetched.liveEventsMap;
      cachedSportRecords = fetched.sportRecordsMap;
    }
  } catch (err) {
    console.warn('Live schedule fetch failed, falling back purely to baseline data:', err);
  }

  liveMap.forEach((liveGame, lookupKey) => {
    const [sportKey, isoDate] = lookupKey.split('|');
    const existingIndex = dataset.findIndex(d => d.sportKey === sportKey && d.isoDate === isoDate);

    if (existingIndex !== -1) {
      if (liveGame.result) dataset[existingIndex].result = liveGame.result;
      if (liveGame.network) dataset[existingIndex].network = liveGame.network;
      if (liveGame.timeStr && liveGame.timeStr !== 'TBD') dataset[existingIndex].timeStr = liveGame.timeStr;
      if (liveGame.location) dataset[existingIndex].location = liveGame.location;
    } else {
      dataset.push(liveGame);
    }
  });

  dataset.sort((a, b) => {
    const aDate = new Date(`${a.isoDate}T00:00:00`).getTime();
    const bDate = new Date(`${b.isoDate}T00:00:00`).getTime();
    if (aDate !== bDate) return aDate - bDate;
    return (a.timeStr || '').localeCompare(b.timeStr || '');
  });

  cachedUnifiedDataset = dataset;
  return cachedUnifiedDataset;
}

function getSportRecords() {
  return cachedSportRecords;
}
