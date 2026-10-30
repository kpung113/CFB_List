window.fetchAllSECInjuries = async function() {
  try {
    const response = await fetch('./sec-injuries.json?' + new Date().getTime());
    if (!response.ok) return {};
    
    const flatInjuries = await response.json();
    
    // Group the flat list by team so your HTML page card layout can render them
    const grouped = {};
    
    if (Array.isArray(flatInjuries)) {
      flatInjuries.forEach(item => {
        const teamName = item.team || "SEC Team";
        if (!grouped[teamName]) {
          grouped[teamName] = { players: [] };
        }
        grouped[teamName].players.push({
          player: item.player,
          position: item.position,
          status: item.status,
          details: item.details || ""
        });
      });
    }
    
    return grouped;
  } catch (err) {
    console.error("Failed to load SEC injuries JSON:", err);
    return {};
  }
};
