// flightChecker.js - Multi-Airport Travel Link Generator with 2 Adults + 2 Kids Family Defaults

/**
 * Calculates Friday departure and Sunday return dates from a Saturday game date.
 * @param {string} saturdayDateStr - Date in 'YYYY-MM-DD' format
 * @returns {object} { departDate, returnDate }
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
 * Builds a direct Google Flights deep-link URL with multi-airport parameters and family passenger defaults.
 * @param {string} originAirports - Encoded origin airport string (e.g. 'TPA%20or%20MCO...')
 * @param {string} destAirports - Encoded destination airport string
 * @param {string} departDate - YYYY-MM-DD
 * @param {string} returnDate - YYYY-MM-DD
 * @returns {string} Google Flights search URL
 */
function buildGoogleFlightsUrl(originAirports, destAirports, departDate, returnDate) {
  return `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports}%20from%20${originAirports}%20on%20${departDate}%20through%20${returnDate}%20for%202%20adults%202%20children`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 * @param {string} opponentAbbrev - SEC team code (e.g., 'TEX', 'LSU', 'FLA')
 * @param {string} saturdayDateStr - Game date in 'YYYY-MM-DD'
 * @param {boolean} isAway - True if Away game, False if Home game (Starkville)
 * @returns {string} HTML string to embed on schedule card
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Central/West Florida Origin Airports (Tampa, Orlando, St. Pete-Clearwater, Lakeland, Sarasota)
  const origins = "TPA%20or%20MCO%20or%20PIE%20or%20LAL%20or%20SRQ";

  // -----------------------------------------------------------------
  // 1. HOME GAMES (Starkville Regional Hubs: GTR, BHM, JAN, MEM)
  // -----------------------------------------------------------------
  if (!isAway) {
    const homeDestinations = "GTR%20or%20BHM%20or%20JAN%20or%20MEM";
    const flightUrl = buildGoogleFlightsUrl(origins, homeDestinations, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville (GTR/BHM/JAN/MEM)
        </a>
      </div>
    `;
  }

  // -----------------------------------------------------------------
  // 2. AWAY GAMES
  // -----------------------------------------------------------------
  const travelInfo = typeof SEC_TRAVEL_MAP !== 'undefined' ? SEC_TRAVEL_MAP[opponentAbbrev] : null;

  // Handle Drive-Only Destinations (e.g., Florida / Gainesville)
  if (travelInfo && travelInfo.driveOnly) {
    return `
      <div class="card-travel-action">
        <span class="drive-badge">🚗 ${travelInfo.driveTimeFromTampa || 'Drive Destination'}</span>
      </div>
    `;
  }

  // Away Flight Destinations (e.g., AUS for Texas, MSY for LSU)
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
