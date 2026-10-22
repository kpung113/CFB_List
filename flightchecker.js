// flightChecker.js - Reliable Multi-Airport & Passenger Deep-Link Generator

/**
 * Encodes an integer into a Protocol Buffer Varint byte array.
 */
function encodeVarint(val) {
  const bytes = [];
  while (val > 127) {
    bytes.push((val & 0x7f) | 0x80);
    val >>>= 7;
  }
  bytes.push(val & 0x7f);
  return bytes;
}

/**
 * Encodes a key/value length-delimited string field (Wire Type 2).
 */
function encodeStringField(fieldNum, str) {
  const encoder = new TextEncoder();
  const strBytes = Array.from(encoder.encode(str));
  const tag = (fieldNum << 3) | 2;
  return [...encodeVarint(tag), ...encodeVarint(strBytes.length), ...strBytes];
}

/**
 * Encodes a length-delimited sub-message field (Wire Type 2).
 */
function encodeMessageField(fieldNum, subMsgBytes) {
  const tag = (fieldNum << 3) | 2;
  return [...encodeVarint(tag), ...encodeVarint(subMsgBytes.length), ...subMsgBytes];
}

/**
 * Builds a direct Google Flights deep-link preserving multi-airport pools 
 * and exact passenger payloads using Google's native Protobuf (`tfs=`) schema.
 */
function buildGoogleFlightsUrl(originList, destList, departDate, returnDate) {
  const baseUrl = "https://www.google.com/travel/flights";

  // Parse arrays of IATA airport codes
  const origins = originList.split(',').map(s => s.trim().toUpperCase());
  const dests = destList.split(',').map(s => s.trim().toUpperCase());

  // 1. Build Outbound Flight Leg (Leg 1)
  let leg1 = [
    ...encodeStringField(2, departDate) // Departure Date (YYYY-MM-DD)
  ];
  origins.forEach(orig => { leg1 = leg1.concat(encodeStringField(3, orig)); });
  dests.forEach(dest => { leg1 = leg1.concat(encodeStringField(4, dest)); });

  // 2. Build Inbound Flight Leg (Leg 2)
  let leg2 = [
    ...encodeStringField(2, returnDate) // Return Date (YYYY-MM-DD)
  ];
  dests.forEach(dest => { leg2 = leg2.concat(encodeStringField(3, dest)); });
  origins.forEach(orig => { leg2 = leg2.concat(encodeStringField(4, orig)); });

  // 3. Construct Root Protobuf Payload
  let rootBytes = [
    0x08, 0x1c, 0x10, 0x02, // Header configuration: Round-Trip flight mode
    ...encodeMessageField(2, leg1),
    ...encodeMessageField(2, leg2),
    0x28, 0x01, // Economy class selection
    0x38, 0x02, // Adults count = 2
    0x40, 0x02  // Children count = 2
  ];

  // 4. Convert Bytes to URL-Safe Base64 String
  const binaryString = String.fromCharCode.apply(null, rootBytes);
  const base64Url = btoa(binaryString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${baseUrl}?tfs=${base64Url}&tfu=EgYIAhAAGAA`;
}

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
 * Generates compact HTML for travel action buttons on game cards.
 */
function getTravelButtonHtml(opponentAbbrev, saturdayDateStr, isAway) {
  const dates = getGameWeekendDates(saturdayDateStr);

  // Central/West FL Origin Airports
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
