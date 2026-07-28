/** Contact details, in one place so every page agrees. */

export const STUDIO_NAME = "Mirabelle";

// Placeholder in the 555-01xx range, which is reserved for fictional use so it
// can never ring a real person. Replace with the studio's actual number.
export const STUDIO_PHONE = "(703) 555-0142";
export const STUDIO_PHONE_HREF = "tel:+17035550142";

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
