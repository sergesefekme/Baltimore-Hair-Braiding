/**
 * Pure formatting helpers, deliberately kept out of `services.ts`.
 *
 * `services.ts` imports `node:fs` to read the CSV, so anything a client
 * component needs has to live somewhere that does not drag the filesystem into
 * the browser bundle.
 */

/** "$200" — no cents; every price on the menu is a whole dollar. */
export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Turns "Box Braids" into "box-braids" for anchors, routes and filenames. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
