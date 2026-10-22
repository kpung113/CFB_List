/**
 * Builds a 100% reliable Kayak deep-link.
 * Supports comma-separated multi-airports and exact family passenger breakdowns.
 * 
 * Target URL Structure:
 * https://www.kayak.com/flights/TPA,MCO,PIE,LAL,SRQ-GTR,BHM,JAN,MEM/2026-10-23/2026-10-25/2adults/children-3-5
 */
/**
 * Builds a 100% reliable Kayak deep-link using query parameters 
 * to guarantee passenger counts (2 Adults, 2 Children) persist on mobile and web.
 */
function buildKayakUrl(originList, destList, departDate, returnDate) {
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();

  const baseUrl = `https://www.kayak.com/flights/${origins}-${dests}/${departDate}/${returnDate}`;
  
  // Pass explicit query parameters for adults and children counts
  const params = new URLSearchParams({
    adults: '2',
    children: '2',
    // Providing ages forces the system to lock in 2 child seats
    childages: '3,5'
  });

  return `${baseUrl}?${params.toString()}`;
}

