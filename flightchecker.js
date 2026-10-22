// flightChecker.js - Handles both Home (Starkville) and Away Travel Links

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
 * Builds a direct Google Flights deep-link URL.
 */
function buildGoogleFlightsUrl(origin, destination, departDate, returnDate) {
  return `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${departDate}%20through%20${returnDate}`;
}

/**
 * Generates the HTML for travel actions on any schedule game card (Home or Away).
 * @param {string} opponentAbbrev - Team code (e.g., 'TEX', 'LSU', 'FLA')
 * @param {string} saturdayDateStr - Game date in 'YYYY-MM-DD'
 * @param {boolean} isAway - True if Away, False if Home (Starkville)
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // -----------------------------------------------------------------
  // 1. HOME GAMES (Starkville / GTR Flight)
  // -----------------------------------------------------------------
  if (!isAway) {
    const homeAirport = "GTR"; // Golden Triangle Regional (Starkville)
    const flightUrl = buildGoogleFlightsUrl("TPA", homeAirport, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn home-btn">
          🔔 Fly to Starkville (${homeAirport})
        </a>
      </div>
    `;
  }

  // -----------------------------------------------------------------
  // 2. AWAY GAMES
  // -----------------------------------------------------------------
  const travelInfo = typeof SEC_TRAVEL_MAP !== 'undefined' ? SEC_TRAVEL_MAP[opponentAbbrev] : null;

  // Drive-Only Destinations (e.g. Florida / Gainesville via I-75)
  if (travelInfo && travelInfo.driveOnly) {
    return `
      <div class="card-travel-action">
        <span class="drive-badge">🚗 ${travelInfo.driveTimeFromTampa || 'Drive Destination'}</span>
      </div>
    `;
  }

  // Away Flight Destinations
  const destAirport = travelInfo ? travelInfo.primaryAirport : opponentAbbrev;
  const flightUrl = buildGoogleFlightsUrl("TPA", destAirport, dates.departDate, dates.returnDate);

  return `
    <div class="card-travel-action">
      <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn away-btn">
        ✈️ Check Flights (${destAirport})
      </a>
    </div>
  `;
}
