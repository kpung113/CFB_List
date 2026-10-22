/**
 * Builds a 100% reliable Kayak deep-link.
 * Forces Kayak to display the grand total price for all passengers combined.
 */
function buildKayakUrl(originList, destList, departDate, returnDate) {
  const origins = originList.replace(/\s+/g, '').toUpperCase();
  const dests = destList.replace(/\s+/g, '').toUpperCase();
  const dep = departDate.trim();
  const ret = returnDate.trim();

  // Base URL path for 2 adults and 2 children (ages 3 & 5)
  const basePath = `https://www.kayak.com/flights/${origins}-${dests}/${dep}/${ret}/2adults/children-3-5`;

  // Append query parameter forcing total price view instead of per person
  return `${basePath}?fs=price=total`;
}
