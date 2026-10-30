window.fetchAllSECInjuries = async function() {
  try {
    const response = await fetch('./sec-injuries.json?' + new Date().getTime());
    if (!response.ok) return {};
    
    const flatInjuries = await response.json();
    const grouped = {};
    
    if (Array.isArray(flatInjuries) && flatInjuries.length > 0) {
      flatInjuries.forEach(item => {
        const teamName = item.team || "SEC Team";
        if (!grouped[teamName]) {
          grouped[teamName] = { players: [] };
        }
        grouped[teamName].players.push({
          player: item.player || "Unknown",
          position: item.position || "",
          status: item.status || "Available",
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
