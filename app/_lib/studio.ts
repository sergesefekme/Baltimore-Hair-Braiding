/** Contact details, in one place so every page agrees. */

export const STUDIO_NAME = "Mirabelle";

/**
 * The studio's two real numbers.
 *
 * Each has a display form and a `tel:` form, and they must be edited together.
 * The `tel:` value is E.164 — a leading +, country code, no punctuation — which
 * is the only format every dialler parses reliably; the display form is purely
 * for reading.
 */
export const STUDIO_PHONE_OFFICE = "(703) 991-4891";
export const STUDIO_PHONE_OFFICE_HREF = "tel:+17039914891";

export const STUDIO_PHONE_MOBILE = "(571) 426-0602";
export const STUDIO_PHONE_MOBILE_HREF = "tel:+15714260602";

/**
 * The number to give when there is only room for one — an inline "call the
 * studio" in a confirmation or an error, where offering a choice of two is
 * noise. Aliases the office line, so those callers need no changes when a
 * number is added or swapped above.
 */
export const STUDIO_PHONE = STUDIO_PHONE_OFFICE;
export const STUDIO_PHONE_HREF = STUDIO_PHONE_OFFICE_HREF;

export const STUDIO_ADDRESS = {
  street: "44048 Lords Valley Ter",
  locality: "Ashburn",
  region: "VA",
  postalCode: "20147",
  country: "US",
} as const;

/** Address as displayed, one line per row. */
export const STUDIO_ADDRESS_LINES = [
  STUDIO_ADDRESS.street,
  `${STUDIO_ADDRESS.locality}, ${STUDIO_ADDRESS.region} ${STUDIO_ADDRESS.postalCode}`,
] as const;

/** Single-line form, for link titles and structured data. */
export const STUDIO_ADDRESS_ONE_LINE = STUDIO_ADDRESS_LINES.join(", ");

/** Opens the address in whichever maps app the visitor's device prefers. */
export const STUDIO_MAPS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  STUDIO_ADDRESS_ONE_LINE,
)}`;

/**
 * Turn-by-turn directions to the studio.
 *
 * There is deliberately no `origin` parameter. Leave it out and Google routes
 * from wherever the visitor happens to be when they tap the link; setting one
 * would give everybody directions from the same arbitrary starting point.
 */
export const STUDIO_DIRECTIONS_HREF = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  STUDIO_ADDRESS_ONE_LINE,
)}`;

/**
 * Position of the map pin, and the point distances are measured from.
 *
 * Taken from what Google Maps itself resolves STUDIO_ADDRESS to. `ServiceArea`
 * still geocodes the address when the map loads and prefers that result, so
 * these numbers are the starting centre and the fallback for when the Geocoding
 * API is unreachable — but they are accurate, not a rough guess.
 *
 * If the studio moves, update STUDIO_ADDRESS above first. To refresh these:
 * open the new address in Google Maps, right-click the pin, and the first item
 * in the menu copies "39.033156, -77.476141" to your clipboard.
 */
export const STUDIO_COORDS = { lat: 39.0331558, lng: -77.4761405 } as const;
