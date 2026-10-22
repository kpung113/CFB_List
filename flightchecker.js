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
/**
 * Builds a robust Google Flights deep-link supporting multi-airport 
 * groupings and passenger counts via natural language query structuring.
 */
function buildGoogleFlightsUrl(originList, destList, departDate, returnDate) {
  const baseUrl = "https://www.google.com/travel/flights";
  
  // Transform comma-separated lists into natural language "OR" clusters 
  // that Google Flights' text parser can successfully resolve.
  const formattedOrigins = originList.split(',').map(s => s.trim()).join(' or ');
  const formattedDests = destList.split(',').map(s => s.trim()).join(' or ');

  // Explicitly state passenger breakdown in the query string so 
  // Google's NLU parser configures the state panel correctly.
  const passengerQuery = "2 adults and 2 children";

  const params = new URLSearchParams({
    q: `Flights from ${formattedOrigins} to ${formattedDests} on ${departDate} returning ${returnDate} for ${passengerQuery}`
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
