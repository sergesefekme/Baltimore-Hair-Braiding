"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import {
  SERVICE_RADIUS_MILES,
  formatMiles,
  geocodeZipViaOsm,
  haversineMiles,
  osmEmbedUrl,
  type Point,
  type ZipLookup,
} from "../_lib/service-area";
import {
  STUDIO_ADDRESS_ONE_LINE,
  STUDIO_COORDS,
  STUDIO_DIRECTIONS_HREF,
  STUDIO_NAME,
  STUDIO_PHONE,
} from "../_lib/studio";
import { Button } from "./Button";
import { Field, Input } from "./Field";

/**
 * Anything prefixed NEXT_PUBLIC_ is substituted into the browser bundle at build
 * time — so this key is public, and there is no way to make it otherwise. That is
 * expected for the Maps JavaScript API: protect it in the Google Cloud console
 * with an HTTP-referrer restriction rather than by trying to hide it.
 *
 * Unset is a supported state. Everything on this page works without it, using
 * OpenStreetMap; a key upgrades the map to Google's, nothing more.
 */
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * `loading=async` tells Google to send a small bootstrap loader and fetch each
 * library only when asked for it, which is what `importLibrary` below does.
 */
const MAPS_SCRIPT_SRC = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async`;

/**
 * The studio's resolved position, cached for the lifetime of the page.
 *
 * Module scope rather than component state on purpose: leaving /location and
 * coming back remounts this component, and where the studio is cannot have
 * changed in between. Caching here costs one geocoding request per visit instead
 * of one per mount.
 */
let studioPoint: Point | null = null;

/**
 * Where the pin goes and what distances are measured from.
 *
 * With Google available this asks it to turn the address into coordinates, so
 * the address string stays the single source of truth. Without it, STUDIO_COORDS
 * is already the right answer — it holds what Google resolves that address to.
 */
async function resolveStudioPoint(
  geocoder: google.maps.Geocoder | null,
): Promise<Point> {
  if (studioPoint) return studioPoint;
  if (!geocoder) return STUDIO_COORDS;

  try {
    const { results } = await geocoder.geocode({
      address: STUDIO_ADDRESS_ONE_LINE,
    });
    const location = results[0]?.geometry.location;
    // `toJSON()` unwraps Google's LatLng class into a plain { lat, lng }, which
    // is what the distance maths takes.
    if (location) studioPoint = location.toJSON();
  } catch {
    // Swallowed deliberately: STUDIO_COORDS is a good answer on its own.
  }

  return studioPoint ?? STUDIO_COORDS;
}

export function ServiceArea() {
  const mapRef = useRef<HTMLDivElement>(null);
  // One Geocoder for the whole page. It carries no per-request state, so
  // building a fresh one per lookup would be waste. Null until Google's script
  // has loaded, and forever if there is no key.
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  // React mounts components twice in development to surface side-effect bugs,
  // which would otherwise build two maps in the same <div>.
  const mapStarted = useRef(false);

  const [googleMapFailed, setGoogleMapFailed] = useState(false);
  const [zip, setZip] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miles, setMiles] = useState<number | null>(null);

  async function initGoogleMap() {
    const container = mapRef.current;
    if (!container || mapStarted.current) return;
    mapStarted.current = true;

    try {
      // Each library arrives separately under `loading=async`. Reading
      // `google.maps.Map` directly here would be a race — importLibrary is how
      // you wait for the specific pieces you use. Requested together because
      // they are independent downloads.
      const [{ Map }, { Geocoder }, { Marker }] = await Promise.all([
        google.maps.importLibrary("maps"),
        google.maps.importLibrary("geocoding"),
        google.maps.importLibrary("marker"),
      ]);

      geocoderRef.current = new Geocoder();
      const center = await resolveStudioPoint(geocoderRef.current);

      const map = new Map(container, {
        center,
        // Close enough to read the surrounding streets, wide enough to show
        // which part of Ashburn this is.
        zoom: 15,
        // A scroll-wheel zoom that swallows the page scroll is the most
        // complained-about behaviour an embedded map has. Dragging and the
        // +/− buttons still work.
        scrollwheel: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      // `Marker` rather than `AdvancedMarkerElement`: advanced markers require a
      // Map ID created in the Google Cloud console, and one plain pin on a
      // one-location page does not earn that setup step. Marker is deprecated
      // but still supported; moving over later is a change to these few lines.
      new Marker({
        map,
        position: center,
        title: `${STUDIO_NAME} — ${STUDIO_ADDRESS_ONE_LINE}`,
      });
    } catch {
      // A rejected key, a restriction that does not cover this domain, a
      // disabled API. Whatever the cause, fall through to OpenStreetMap rather
      // than leaving a blank rectangle.
      setGoogleMapFailed(true);
    }
  }

  /**
   * Zip code to coordinates, by whichever service is available.
   *
   * Google when its script has loaded, OpenStreetMap otherwise — which also
   * covers the seconds before Google's script arrives, so the button never has a
   * dead period where pressing it does nothing useful.
   */
  async function lookupZip(entered: string): Promise<ZipLookup> {
    const geocoder = geocoderRef.current;
    if (!geocoder) return geocodeZipViaOsm(entered);

    try {
      const { results } = await geocoder.geocode({
        // `componentRestrictions` rather than passing "20147" as an address: as
        // free text those five digits can match a house number, or a postcode in
        // another country. This says "a US postal code, nothing else".
        componentRestrictions: { postalCode: entered, country: "US" },
      });

      const location = results[0]?.geometry.location;
      return location
        ? { ok: true, point: location.toJSON() }
        : { ok: false, reason: "not-found" };
    } catch (caught) {
      // geocode() rejects both for "that zip does not exist" and for a genuine
      // failure (no network, key rejected, quota spent). Compared as a plain
      // string rather than through `google.maps.GeocoderStatus`, because reading
      // a property off the API from inside a catch block risks throwing a second
      // error and leaving the visitor with no message at all.
      const status = (caught as { code?: string } | null)?.code;
      return {
        ok: false,
        reason: status === "ZERO_RESULTS" ? "not-found" : "failed",
      };
    }
  }

  async function onCheck(event: React.FormEvent) {
    event.preventDefault();

    const entered = zip.trim();
    setError(null);
    setMiles(null);

    // Checked before spending a request. Five digits is the whole shape of a US
    // zip code, so "abc" or "2014" can only ever come back as a failure.
    if (!/^\d{5}$/.test(entered)) {
      setError("Enter a five-digit zip code, like 20147.");
      return;
    }

    setChecking(true);
    try {
      const lookup = await lookupZip(entered);

      if (!lookup.ok) {
        setError(
          lookup.reason === "not-found"
            ? `We could not find the zip code ${entered}. Check the digits and try again.`
            : `We could not check that just now. Try again in a moment, or call the studio on ${STUDIO_PHONE}.`,
        );
        return;
      }

      // Both points are centre points, so this is a distance between two dots on
      // a map — not a driving route, which is why the copy says "away" rather
      // than a drive time.
      const anchor = await resolveStudioPoint(geocoderRef.current);
      setMiles(haversineMiles(anchor, lookup.point));
    } finally {
      setChecking(false);
    }
  }

  const inside = miles !== null && miles <= SERVICE_RADIUS_MILES;
  // Google only when there is a key AND it actually worked.
  const useGoogleMap = Boolean(API_KEY) && !googleMapFailed;

  return (
    <div className="flex flex-col gap-10">
      {API_KEY && (
        <Script
          src={MAPS_SCRIPT_SRC}
          // onReady, not onLoad: onLoad fires once per page load, but a visitor
          // who leaves this page and returns remounts the component with the
          // script already cached — and it is the remount that leaves an empty
          // <div> needing a map put into it. onReady fires on every mount.
          //
          // `void` because onReady must hand back nothing, while initGoogleMap is
          // async and therefore returns a promise. It handles its own failures.
          onReady={() => void initGoogleMap()}
          onError={() => setGoogleMapFailed(true)}
        />
      )}

      {useGoogleMap ? (
        <div
          ref={mapRef}
          // overflow-hidden so Google's own controls stay inside the corners.
          // Not the `sweep` utility: that radius is reserved for portraits.
          className="h-[20rem] w-full overflow-hidden rounded-md border border-line bg-surface-warm sm:h-[26rem]"
        />
      ) : (
        /* No Google key, or Google refused it. OpenStreetMap needs neither, so
           the page still shows a real map with the studio pinned on it. */
        <iframe
          src={osmEmbedUrl(STUDIO_COORDS)}
          title={`Map showing ${STUDIO_NAME} at ${STUDIO_ADDRESS_ONE_LINE}`}
          loading="lazy"
          className="h-[20rem] w-full rounded-md border border-line bg-surface-warm sm:h-[26rem]"
        />
      )}

      <form onSubmit={onCheck} noValidate className="flex flex-col gap-5">
        <div>
          <h2 className="text-h3 font-display text-ink">
            Are you in our service area?
          </h2>
          <p className="mt-3 max-w-[52ch] text-body-sm text-ink-muted">
            Home appointments run to{" "}
            <span data-numeric="">{SERVICE_RADIUS_MILES}</span> miles of the
            studio. Enter your zip code and we will tell you straight away.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="sm:w-48">
            <Field label="Your zip code" error={error ?? undefined}>
              <Input
                name="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="20147"
                data-numeric=""
                value={zip}
                onChange={(event) => {
                  setZip(event.target.value);
                  // Clearing on edit rather than leaving a stale answer under a
                  // field that no longer matches it.
                  setError(null);
                  setMiles(null);
                }}
              />
            </Field>
          </div>

          {/* Mirrors `Field`'s own structure — flex-col, gap-2, a label-sized
              first child — so the button lines up with the input beside it
              rather than with the label above it. Copying the shape keeps them
              aligned whatever the label's font metrics turn out to be, which a
              hardcoded top margin would not. */}
          <div className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className="invisible hidden text-eyebrow uppercase sm:block"
            >
              Check
            </span>
            <Button type="submit" variant="primary" loading={checking}>
              Check
            </Button>
          </div>
        </div>

        {/* A live region, so the answer is announced rather than only seen. It
            stays in the DOM empty-handed for the same reason: a region added at
            the moment it gains content is often not announced at all. */}
        <div role="status" aria-live="polite">
          {miles !== null && (
            <div
              className={`rounded-md border-l-[3px] bg-surface p-4 ${
                inside ? "border-confirmed" : "border-attention"
              }`}
            >
              {/* The tone-coloured word carries the outcome as well as the
                  colour does — colour is never the only signal. */}
              <p
                className={`text-body-sm ${
                  inside ? "text-confirmed" : "text-attention"
                }`}
              >
                {inside
                  ? `You're within our service area (${formatMiles(miles)} miles away).`
                  : `You're outside our service area (${formatMiles(miles)} miles away).`}
              </p>

              {inside ? (
                <p className="mt-1 text-caption text-ink-muted">
                  Mention your zip code when you book and we will confirm the
                  travel time with you.
                </p>
              ) : (
                <>
                  <p className="mt-1 text-caption text-ink-muted">
                    You are welcome at the studio itself — plenty of clients
                    travel in for an appointment.
                  </p>
                  <p className="mt-2">
                    <a
                      href={STUDIO_DIRECTIONS_HREF}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                    >
                      Get directions
                    </a>
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <p className="max-w-[60ch] text-caption text-ink-muted">
          Measured in a straight line from the studio to the centre of your zip
          code, so treat it as a guide rather than a driving distance.
        </p>
      </form>
    </div>
  );
}
