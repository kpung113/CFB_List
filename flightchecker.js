// flightchecker.js - Kayak Flight Deep-Link Generator

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

function buildKayakUrl(originList, destList, departDate, returnDate) {
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();
  const dep = departDate.trim();
  const ret = returnDate.trim();

  return `https://www.kayak.com/flights/${origins}-${dests}/${dep}/${ret}/2adults/children-3-5`;
}

function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);
  const origins = "TPA,MCO,PIE,LAL,SRQ";

  if (!isAway) {
    const homeDestinations = "GTR,BHM,JAN,MEM";
    const flightUrl = buildKayakUrl(origins, homeDestinations, dates.departDate, dates.returnDate);

    return `
      <div class="card-travel-action">
        <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
          ✈️ Fly to Starkville
        </a>
      </div>
    `;
  }

  const travelInfo = (typeof SEC_TRAVEL_MAP !== 'undefined' && SEC_TRAVEL_MAP) ? SEC_TRAVEL_MAP[opponentAbbrev] : null;

  if (travelInfo && travelInfo.driveOnly) {
    return `
      <div class="card-travel-action">
        <span class="drive-badge">🚗 ${travelInfo.driveTimeFromTampa || 'Drive Destination'}</span>
      </div>
    `;
  }

  const destAirport = travelInfo ? (travelInfo.airports || travelInfo.primaryAirport || opponentAbbrev) : opponentAbbrev;
  const flightUrl = buildKayakUrl(origins, destAirport, dates.departDate, dates.returnDate);

  return `
    <div class="card-travel-action">
      <a href="${flightUrl}" target="_blank" rel="noopener" class="card-flight-btn">
        ✈️ Check Flights (${destAirport})
      </a>
    </div>
  `;
}
