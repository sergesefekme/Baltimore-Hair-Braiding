import { readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Style photographs available at build time.
 *
 * The gallery is driven by the filesystem rather than a manifest: drop
 * `public/images/styles/<slug>.webp` in and it appears. Nothing to keep in sync,
 * and no broken <img> when a photo has not been shot yet — a style with no file
 * simply renders its generative parting panel instead.
 *
 * A style can have several photographs. Number them and they group
 * automatically, newest naming convention first:
 *
 *   knotless-box-braids.webp        → one photo
 *   knotless-box-braids-01.webp     → first of several
 *   knotless-box-braids-02.webp     → second, and so on
 *
 * The card shows the first; the style sheet shows the whole set.
 *
 * Which one leads is a real editorial decision, so it is nameable rather than
 * an accident of sort order. Append `-cover` and that photo goes first:
 *
 *   knotless-box-braids-06-cover.webp   → the card image
 *
 * This matters because the shot that documents a style best is rarely the one
 * that happened to be taken first. The card is the only photo most visitors
 * ever see, so it should be the cleanest of the set — not whichever the camera
 * numbered `01`. Without a cover the group falls back to numeric order, so
 * nothing has to be renamed until someone actually has an opinion.
 *
 * Cache-busting note: appending `?v=<mtime>` here does NOT work. Next 16
 * requires every query string on a local image to be declared verbatim in
 * `images.localPatterns.search`, as an anti-enumeration measure, and an mtime
 * cannot be declared ahead of time. Swapped images are handled instead by
 * `images.minimumCacheTTL` in next.config.ts — see the comment there.
 */
const STYLES_DIR = path.join(process.cwd(), "public", "images", "styles");
const IMAGE_EXTENSIONS = new Set([".webp", ".avif", ".jpg", ".jpeg", ".png"]);

/** Marks the chosen card image. Stripped before the slug is derived. */
const COVER_SUFFIX = "-cover";

/** Strips `-cover` and a trailing `-01` so variants collapse onto one style. */
function baseSlug(filename: string): string {
  return filename
    .replace(new RegExp(`${COVER_SUFFIX}$`), "")
    .replace(/-(\d{1,3})$/, "");
}

/**
 * Cached in production only. The directory is fixed once the build runs, so
 * re-reading it per request is pure waste there — but in development the whole
 * point of this module is that dropping a file in makes it appear, and a
 * process-lifetime cache quietly breaks that promise: the photo is on disk, the
 * page does not show it, and nothing explains why until you restart.
 */
const shouldCache = process.env.NODE_ENV === "production";

let cache: Map<string, string[]> | undefined;

/**
 * Map of slug → ordered public image paths, e.g.
 * `"knotless-box-braids" → ["/images/styles/knotless-box-braids-01.webp", …]`.
 *
 * Returns an empty map when the directory is missing, so a checkout without
 * photographs still builds.
 */
export async function getStyleImages(): Promise<Map<string, string[]>> {
  if (cache && shouldCache) return cache;

  const found = new Map<string, string[]>();

  try {
    const entries = await readdir(STYLES_DIR, { withFileTypes: true });

    // Sort by filename so `-01` reliably precedes `-02`; the first is what the
    // card shows, so the order needs to be deliberate rather than whatever the
    // filesystem happens to return.
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en"));

    for (const name of files) {
      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;

      const stem = path.basename(name, ext).toLowerCase();
      const slug = baseSlug(stem);
      const src = `/images/styles/${name}`;
      const list = found.get(slug);

      // Promote the cover to the front rather than sorting it there: a
      // comparator that lets a cover outrank its siblings but not unrelated
      // files is not a total order, and V8 is free to return anything for one.
      // Bucketing first, reordering second, is order-independent.
      if (!list) found.set(slug, [src]);
      else if (stem.endsWith(COVER_SUFFIX)) list.unshift(src);
      else list.push(src);
    }
  } catch {
    // No directory yet. Every card falls back to its parting panel.
  }

  cache = found;
  return cache;
}
