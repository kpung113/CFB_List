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
 * Builds a clean Google Flights URL using standard query parameters.
 * Pre-set for 2 Adults and 2 Children.
 */
function buildGoogleFlightsUrl(origin, destination, departDate, returnDate) {
  // Using explicit text search query that Google Flights reliably parses
  const searchQuery = `flights from ${origin} to ${destination} on ${departDate} returning ${departDate}`;
  const encodedQuery = encodeURIComponent(searchQuery);
  return `https://www.google.com/travel/flights?q=${encodedQuery}&px=2,2,0,0`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Primary origin grouping (using TPA as the main hub since Google Flights natively expands nearby airports, or primary codes)
  const origins = "TPA";

  // 1. HOME GAMES (Starkville Regional Hubs)
  if (!isAway) {
    const homeDestination = "GTR"; // Golden Triangle Regional (Starkville)
    const flightUrl = buildGoogleFlightsUrl(origins, homeDestination, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville (GTR)
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
      <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-dfn card-flight-btn">
        ✈️ Check Flights (${destAirport})
      </a>
    </div>
  `;
}
