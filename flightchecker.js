// flightChecker.js - Multi-Airport Travel Link Generator (Comma-separated for Google Flights)

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
 * Builds a direct Google Flights URL using comma-separated airport codes.
 * Pre-set for 2 Adults and 2 Children.
 */
function buildGoogleFlightsUrl(originAirports, destAirports, departDate, returnDate) {
  return `https://www.google.com/travel/flights?q=Flights%20to%20${destAirports}%20from%20${originAirports}%20on%20${departDate}%20through%20${returnDate}%20for%202%20adults%202%20children`;
}

/**
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Comma-separated origin airports for Google Flights multi-origin search
  const origins = "TPA%2CMCO%2CPIE%2CLAL%2CSRQ";

  // 1. HOME GAMES (Starkville Regional Hubs: GTR, BHM, JAN, MEM)
  if (!isAway) {
    const homeDestinations = "GTR%2CBHM%2CJAN%2CMEM";
    const flightUrl = buildGoogleFlightsUrl(origins, homeDestinations, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville (GTR/BHM/JAN/MEM)
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
