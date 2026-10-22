// flightChecker.js - Kayak Multi-Airport & Family Payload Deep-Link Generator

/**
 * Calculates Friday departure and Sunday return dates from a Saturday game date.
 */
function getGameWeekendDates(saturdayDateStr) {
  const saturday = new Date(saturdayDateStr + 'T12:00:00');
  
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() - 1);
  
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    departDate: friday.toISOString().split('T')[0],
    returnDate: sunday.toISOString().split('T')[0]
  };
}

/**
 * Builds a 100% reliable Kayak deep-link.
 * Supports comma-separated multi-airports and exact passenger counts.
 * 
 * Target URL Structure:
 * https://www.kayak.com/flights/TPA,MCO,PIE,LAL,SRQ-GTR,BHM,JAN,MEM/2026-10-23/2026-10-25/2adults/2children
 */
function buildKayakUrl(originList, destList, departDate, returnDate) {
  // Strip whitespace from airport lists to keep URL parameters clean
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();

  // Family payload parameters: 2 adults and 2 children
  const passengerPath = "2adults/2children";

  return `https://www.kayak.com/flights/${origins}-${dests}/${departDate}/${returnDate}/${passengerPath}`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Central/West FL Origin Airports
  const origins = "TPA,MCO,PIE,LAL,SRQ";

  // 1. HOME GAMES (Starkville & Surrounding Hubs)
  if (!isAway) {
    const homeDestinations = "GTR,BHM,JAN,MEM";
    const flightUrl = buildKayakUrl(origins, homeDestinations, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville (Kayak)
        </a>
      </div>
    `;
  }

  // 2. AWAY GAMES
  const travelInfo = typeof SEC_TRAVEL_MAP !== 'undefined' ? SEC_TRAVEL_MAP[opponentAbbrev] : null;

  // Drive-only destinations (e.g. Florida / Gainesville)
  if (travelInfo && travelInfo.driveOnly) {
    return `
      <div class="card-travel-action">
        <span class="drive-badge">🚗 ${travelInfo.driveTimeFromTampa || 'Drive Destination'}</span>
      </div>
    `;
  }

  // Away flight destinations (supports single airport or comma-separated lists)
  const destAirport = travelInfo ? (travelInfo.airports || travelInfo.primaryAirport) : opponentAbbrev;
  const flightUrl = buildKayakUrl(origins, destAirport, dates.departDate, dates.returnDate);

  return `
    <div class="card-travel-action">
      <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
        ✈️ Check Flights (${destAirport})
      </a>
    </div>
  `;
}
