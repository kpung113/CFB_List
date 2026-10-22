/**
 * Builds a 100% reliable Kayak deep-link.
 * Forces the exact path sequence: /ORIGINS-DESTS/DEPART/RETURN/2adults/children-3-5
 */
function buildKayakUrl(originList, destList, departDate, returnDate) {
  // 1. Clean airport lists (uppercase, no whitespace)
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();

  // 2. Format dates
  const dep = departDate.trim();
  const ret = returnDate.trim();

  // 3. Construct direct path string (2 Adults + 2 Children aged 3 & 5)
  return `https://www.kayak.com/flights/${origins}-${dests}/${dep}/${ret}/2adults/children-3-5`;
}
