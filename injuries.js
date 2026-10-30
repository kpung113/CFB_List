async function fetchAllSECInjuries() {
  try {
    // Add cache-busting timestamp so the browser doesn't serve old JSON
    const res = await fetch('./sec-injuries.json?' + new Date().getTime());
    if (!res.ok) return {};

    const rawData = await res.json();
    const grouped = {};

    if (Array.isArray(rawData)) {
      rawData.forEach(item => {
        const teamName = item.team || "SEC Team";
        if (!grouped[teamName]) {
          grouped[teamName] = { players: [] };
        }
        grouped[teamName].players.push({
          player: item.player || "Unknown Player",
          position: item.position || "",
          status: item.status || "Questionable",
          details: item.details || ""
        });
      });
    }

    return grouped;
  } catch (err) {
    console.error("Error fetching SEC injury data:", err);
    return {};
  }
}

// Attach functions to window for injuries.html to call
window.fetchAllSECInjuries = fetchAllSECInjuries;
window.fetchAllCFBInjuries = fetchAllSECInjuries;
