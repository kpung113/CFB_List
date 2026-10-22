// flightChecker.js - Reliable Google Flights Deep-Link Generator

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
 * Builds a robust Google Flights deep-link.
 * 
 * NOTE: Google Flights' text parser breaks if fed comma-separated multi-airport 
 * lists (e.g., "TPA,MCO,PIE"). We extract the primary (first) airport to ensure 
 * the search link resolves cleanly instead of redirecting to the homepage.
 */
function buildGoogleFlightsUrl(originList, destList, departDate, returnDate) {
  const baseUrl = "https://www.google.com/travel/flights";
  
  // Extract primary airports to prevent Google's NLU parser from crashing
  const primaryOrigin = originList.split(',')[0].trim();
  const primaryDest = destList.split(',')[0].trim();

  const params = new URLSearchParams({
    q: `Flights from ${primaryOrigin} to ${primaryDest} on ${departDate} returning ${returnDate}`
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Central/West FL Origin Airports (Primary extraction will use 'TPA')
  const origins = "TPA,MCO,PIE,LAL,SRQ";

  // 1. HOME GAMES (Starkville & Surrounding Hubs)
  if (!isAway) {
    const homeDestinations = "GTR,BHM,JAN,MEM";
    const flightUrl = buildGoogleFlightsUrl(origins, homeDestinations, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville
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

  // Away flight destinations
  const destAirport = travelInfo ? travelInfo.primaryAirport : opponentAbbrev;
  const flightUrl = buildGoogleFlightsUrl(origins, destAirport, dates.departDate, dates.returnDate);

  return `
    <div class="card-travel-action">
      <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
        ✈️ Check Flights (${destAirport})
      </a>
    </div>
  `;
}
