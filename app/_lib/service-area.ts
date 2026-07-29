/**
 * How far Mirabelle travels, and the maths for deciding whether a zip code is
 * inside that. The address itself lives in `studio.ts`.
 */

/* ---------------------------------------------------------------------------
 * SET THE REAL NUMBER HERE.
 *
 * This is a placeholder. Everything the visitor sees follows from it: the note
 * under the zip field, and whether a result reads "within" or "outside". There
 * is nowhere else to change.
 * ------------------------------------------------------------------------ */
export const SERVICE_RADIUS_MILES = 25;

/** A point on the globe in degrees. Same shape Google hands back, so the two interchange. */
export type Point = { lat: number; lng: number };

/**
 * Earth's mean radius in miles. This single number sets the unit of everything
 * `haversineMiles` returns — swap it for 6371 and the function returns
 * kilometres instead, with no other change.
 */
const EARTH_RADIUS_MILES = 3958.8;

/**
 * Trigonometry works in radians. Degrees are just the notation humans write
 * coordinates in, so every angle has to be converted on the way in.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Distance between two points measured across the earth's surface, in miles —
 * the Haversine formula.
 *
 * The naive approach, treating latitude and longitude as x and y on a flat
 * grid, is wrong in a way that matters here: a degree of longitude is about 69
 * miles at the equator but narrows to nothing at the poles. At Ashburn's
 * latitude it is only ~54 miles, so flat-grid maths would overstate every
 * east-west distance by a quarter and put people outside the radius who are
 * comfortably inside it.
 *
 * Haversine works on a sphere instead. Three steps, marked below: turn the two
 * points into an angle at the centre of the earth, then multiply that angle by
 * the earth's radius to get the arc length along the surface.
 */
export function haversineMiles(from: Point, to: Point): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  // 1. `a` is the square of half the chord between the two points on a sphere
  //    of radius 1. The `cos(lat1) * cos(lat2)` factor is what fixes the
  //    flat-grid error described above: it shrinks the longitude term by how
  //    far from the equator the two points sit.
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  // 2. That chord back into an angle, in radians. `atan2` rather than `asin`:
  //    both give the same answer, but `asin` loses precision for points on
  //    opposite sides of the planet, where `a` approaches 1.
  const angle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 3. An angle at the centre of a circle times its radius is the arc length —
  //    here, the distance along the surface.
  return angle * EARTH_RADIUS_MILES;
}

/**
 * "12.4" — one decimal place.
 *
 * Not more: a zip code geocodes to its centre point, which can be a couple of
 * miles from any given house inside it. Printing "12.43" would claim a
 * precision the underlying number does not have.
 */
export function formatMiles(miles: number): string {
  return miles.toFixed(1);
}

/* ---------------------------------------------------------------------------
 * KEYLESS FALLBACKS — OpenStreetMap
 *
 * Google needs an API key, a Cloud project and a card on file. Everything below
 * needs none of those, so the page always has a working map and a working zip
 * check even before a key exists. When one is configured, `ServiceArea` prefers
 * Google and none of this runs.
 * ------------------------------------------------------------------------ */

/** Either a place on the map, or the reason we could not find one. */
export type ZipLookup =
  | { ok: true; point: Point }
  | { ok: false; reason: "not-found" | "failed" };

/**
 * A map image centred on `center` with a pin on it, as a URL you can drop
 * straight into an `<iframe>`. No key, no JavaScript, no account.
 *
 * OpenStreetMap's embed frames the view with a bounding box rather than a zoom
 * level, so the padding below is what sets how close in it sits.
 */
export function osmEmbedUrl(center: Point): string {
  const latPad = 0.006;
  // Wider than the latitude padding because a degree of longitude is only
  // ~54 miles this far north against ~69 for latitude (the same effect
  // `haversineMiles` corrects for). Equal padding would look squashed.
  const lngPad = 0.008;

  const bbox = [
    center.lng - lngPad,
    center.lat - latPad,
    center.lng + lngPad,
    center.lat + latPad,
  ].join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;
}

/**
 * Turns a US zip code into coordinates using Nominatim, OpenStreetMap's own
 * geocoder. Free and keyless.
 *
 * `postalcode` + `country` rather than a free-text search, for the same reason
 * the Google path restricts components: five bare digits could otherwise match
 * a house number or a postcode abroad.
 *
 * Nominatim's usage policy asks for no more than one request a second, which a
 * person typing a zip code and pressing a button cannot exceed. Do not call this
 * in a loop or on every keystroke.
 */
export async function geocodeZipViaOsm(zip: string): Promise<ZipLookup> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("postalcode", zip);
    url.searchParams.set("country", "us");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { ok: false, reason: "failed" };

    const matches = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;
    const first = matches[0];
    if (!first) return { ok: false, reason: "not-found" };

    // Nominatim sends coordinates as strings, so they need converting — and
    // checking, because Number("") is 0 rather than an error and would silently
    // place the visitor off the coast of Africa.
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { ok: false, reason: "failed" };
    }

    return { ok: true, point: { lat, lng } };
  } catch {
    // Network down, request timed out, or malformed JSON. All the same to the
    // visitor, who just needs to be told it did not work.
    return { ok: false, reason: "failed" };
  }
}
