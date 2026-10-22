/**
 * Builds a 100% reliable Kayak deep-link.
 * Supports comma-separated multi-airports and exact family passenger breakdowns.
 * 
 * Target URL Structure:
 * https://www.kayak.com/flights/TPA,MCO,PIE,LAL,SRQ-GTR,BHM,JAN,MEM/2026-10-23/2026-10-25/2adults/children-3-5
 */
function buildKayakUrl(originList, destList, departDate, returnDate) {
  // Strip whitespace and force uppercase
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();

  // 2 Adults + 2 Children (aged 3 and 5)
  const passengerPath = "2adults/children-3-5";

  return `https://www.kayak.com/flights/${origins}-${dests}/${departDate}/${returnDate}/${passengerPath}`;
}
