// flightChecker.js - Structured Google Flights Deep-Link Generator

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
 * Builds a clean Google Flights URL embedding passengers directly in the query text.
 * Pre-set for 2 Adults and 2 Children (in seats).
 */
function buildGoogleFlightsUrl(origin, destination, departDate, returnDate) {
  // Including passenger count explicitly inside the natural-language query string
  const searchQuery = `flights from ${origin} to ${destination} on ${departDate} returning ${returnDate} for 2 adults 2 children`;
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.google.com/travel/flights?q=${encodedQuery}`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Primary origin grouping
  const origins = "TPA";

  // 1. HOME GAMES (Starkville)
  if (!isAway) {
    const homeDestination = "GTR"; // Golden Triangle Regional (Starkville)
    const flightUrl = buildGoogleFlightsUrl(origins, homeDestination, dates.departDate, dates.returnDate);

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

  // Drive-only destinations
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
