// flightChecker.js - Keyless Dynamic SEC Away Travel & Google Flights Link Generator

/**
 * Calculates Friday (day before) and Sunday (day after) travel dates from a Saturday game date.
 * @param {string} saturdayDateStr - Date in 'YYYY-MM-DD' format
 * @returns {object} { departDate, returnDate, departStr, returnStr }
 */
function getGameWeekendDates(saturdayDateStr) {
  const saturday = new Date(saturdayDateStr + 'T12:00:00');
  
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() - 1);
  
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const formatShort = (dateObj) => dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    departDate: friday.toISOString().split('T')[0],
    returnDate: sunday.toISOString().split('T')[0],
    departStr: `${formatShort(friday)} (Fri)`,
    returnStr: `${formatShort(sunday)} (Sun)`
  };
}

/**
 * Builds a direct, pre-populated Google Flights search URL.
 */
function buildGoogleFlightsUrl(origin, destination, departDate, returnDate) {
  // Encodes route and dates straight into Google Flights query format
  return `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${departDate}%20through%20${returnDate}`;
}

/**
 * Generates travel cards for away games.
 * @param {Array} awayGamesList - List of away games with Saturday dates
 */
function generateAwayTravelCards(awayGamesList) {
  return awayGamesList.map(game => {
    const travelInfo = SEC_TRAVEL_MAP[game.abbrev];
    const dates = getGameWeekendDates(game.saturdayDate);

    // Handle Drive-Only Destinations (e.g. Florida / Gainesville)
    if (!travelInfo || travelInfo.driveOnly) {
      return {
        opponent: game.opponent,
        saturdayDate: game.saturdayDate,
        mode: "DRIVE",
        title: `@ ${game.opponent}`,
        driveNotes: travelInfo?.driveTimeFromTampa || "Drive destination via I-75",
        badge: "🚗 Drive Trip"
      };
    }

    const origin = "TPA";
    const dest = travelInfo.primaryAirport;
    const flightUrl = buildGoogleFlightsUrl(origin, dest, dates.departDate, dates.returnDate);

    return {
      opponent: game.opponent,
      saturdayDate: game.saturdayDate,
      mode: "FLY",
      title: `@ ${game.opponent}`,
      route: `${origin} → ${dest}`,
      airportName: travelInfo.airportName,
      driveTimeFromAirport: travelInfo.driveTimeFromAirport,
      travelWindow: `${dates.departStr} – ${dates.returnStr}`,
      flightUrl: flightUrl,
      badge: "✈️ Flight Required"
    };
  });
}
