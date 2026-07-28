"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StyleGroup } from "../_lib/services";
import { formatPrice } from "../_lib/format";
import {
  goBack,
  pushParam,
  readParam,
  replaceWithoutParam,
  useSearchString,
} from "../_lib/url";
import { useBooking } from "./Booking";
import { Parting } from "./Parting";

type MenuBrowserProps = {
  groups: StyleGroup[];
  categories: string[];
  /** slug → ordered public image paths. A plain object because Maps do not
      cross the server/client boundary. */
  images: Record<string, string[]>;
};

const ALL = "All styles";

const PARAM = "style";

export function MenuBrowser({ groups, categories, images }: MenuBrowserProps) {
  const [active, setActive] = useState(ALL);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { open: openBooking } = useBooking();

  // The URL is the single source of truth for which sheet is open. Nothing
  // mirrors it into state, so Back, a pasted link and a card click all take
  // exactly the same path.
  const search = useSearchString();
  const selected = useMemo(() => {
    const slug = readParam(search, PARAM);
    return slug ? (groups.find((g) => g.slug === slug) ?? null) : null;
  }, [search, groups]);

  // True while our own pushed entry is on the stack, so closing can step back
  // rather than stranding a dead entry. False when the user arrived by link.
  const didPush = useRef(false);
  // Set when the URL closed the sheet (Back), so onClose does not then try to
  // change the URL again and bounce the user two entries.
  const urlDrivenClose = useRef(false);

  const visible = useMemo(
    () => (active === ALL ? groups : groups.filter((g) => g.category === active)),
    [groups, active],
  );

  // Split by whether a style has been photographed.
  //
  // A photo-shaped tile for a style with no photo reads as a broken image, and
  // at 34-of-41 that is most of the page. A price list does not need a picture
  // per line: the photographed work gets the gallery, everything else gets a
  // compact row that looks deliberate because it is.
  const [photographed, listed] = useMemo(() => {
    const withPhoto: StyleGroup[] = [];
    const withoutPhoto: StyleGroup[] = [];
    for (const group of visible) {
      (images[group.slug]?.length ? withPhoto : withoutPhoto).push(group);
    }
    return [withPhoto, withoutPhoto];
  }, [visible, images]);

  // Drive the native dialog from the derived selection. A DOM side effect, not
  // a state write — the dialog element is the thing being synchronised.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selected && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";

      // showModal() focuses the first focusable child, which here is a button
      // at the very bottom — enough to scroll the photograph out of view before
      // the sheet is even seen. Focus the heading instead: it starts the reader
      // at the title, keeps focus visible, and leaves the view at the top.
      const heading = dialog.querySelector<HTMLElement>("#style-title");
      if (heading) heading.focus();
      dialog.scrollTop = 0;
    } else if (!selected && dialog.open) {
      urlDrivenClose.current = true;
      didPush.current = false;
      dialog.close();
    }
  }, [selected]);

  const openStyle = useCallback((group: StyleGroup) => {
    didPush.current = true;
    pushParam(PARAM, group.slug);
  }, []);

  const closeStyle = useCallback(() => {
    if (didPush.current) {
      didPush.current = false;
      goBack();
    } else {
      replaceWithoutParam(PARAM);
    }
  }, []);

  // Escape and the backdrop close the dialog natively; reconcile the URL after.
  const handleDialogClose = useCallback(() => {
    document.body.style.overflow = "";
    if (urlDrivenClose.current) {
      urlDrivenClose.current = false;
      return;
    }
    closeStyle();
  }, [closeStyle]);

  // Close the style sheet before the booking form opens — stacking two modals
  // makes Escape ambiguous and focus hard to follow.
  const bookSelected = useCallback(() => {
    const name = selected?.name;
    closeStyle();
    if (name) openBooking(name);
  }, [selected, closeStyle, openBooking]);

  return (
    <>
      <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
        {[ALL, ...categories].map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              type="button"
              // aria-pressed, not colour alone, carries the selected state.
              aria-pressed={isActive}
              onClick={() => setActive(category)}
              className={`inline-flex min-h-11 items-center rounded-xs border px-3 text-eyebrow uppercase transition-colors duration-150 ease-sweep sm:min-h-9 ${
                isActive
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-ink-muted hover:border-accent hover:text-accent"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-4 text-caption text-ink-muted">
        {visible.length} {visible.length === 1 ? "style" : "styles"}
        {active !== ALL ? ` in ${active}` : ""}
      </p>

      {photographed.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {photographed.map((group, index) => (
            <li key={`${group.category}-${group.name}`}>
              <button
                type="button"
                onClick={() => openStyle(group)}
                className="group block w-full text-left"
              >
                <StyleMedia
                  group={group}
                  src={images[group.slug][0]}
                  sweep={index % 2 === 0 ? "left" : "right"}
                />
                <h3 className="mt-3 text-h4 font-display text-ink transition-colors duration-150 ease-sweep group-hover:text-accent">
                  {group.name}
                </h3>
                <p data-numeric="" className="mt-1 text-caption text-ink-muted">
                  {group.flatPrice ? "" : "from "}
                  {formatPrice(group.fromPrice)}
                  {group.variants.length > 1
                    ? ` · ${group.variants.length} options`
                    : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {listed.length > 0 && (
        <section aria-labelledby="also-heading">
          <Parting className={photographed.length > 0 ? "mt-16" : "mt-8"} />
          <h2
            id="also-heading"
            className="mt-10 text-h3 font-display text-ink"
          >
            Also on the menu
          </h2>
          <p className="mt-2 max-w-[52ch] text-body-sm text-ink-muted">
            Everything else we braid. Not photographed yet — tap any of them for
            sizes, timings and prices.
          </p>

          <ul className="mt-8 border-t border-line">
            {listed.map((group) => (
              <li
                key={`${group.category}-${group.name}`}
                className="border-b border-line"
              >
                <button
                  type="button"
                  onClick={() => openStyle(group)}
                  className="group flex min-h-14 w-full flex-col gap-x-6 gap-y-1 py-4 text-left sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                    <span className="text-body-sm text-ink transition-colors duration-150 ease-sweep group-hover:text-accent">
                      {group.name}
                    </span>
                    <span className="text-eyebrow uppercase text-ink-muted">
                      {group.category}
                    </span>
                  </span>
                  <span
                    data-numeric=""
                    className="shrink-0 text-body-sm text-ink-muted"
                  >
                    {group.flatPrice ? "" : "from "}
                    {formatPrice(group.fromPrice)}
                    {group.variants.length > 1
                      ? ` · ${group.variants.length} options`
                      : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="style-title"
        onClose={handleDialogClose}
        className="w-[min(38rem,calc(100vw-2rem))] rounded-md border border-line bg-surface p-0 text-ink shadow-[var(--mb-shadow-card)]"
      >
        {selected && (
          <div>
            {/* Keyed on the style so opening a different one starts at its
                first photograph again. Resetting that index with an effect
                would mean a second render — and a visible flash of the
                previous style's photo — for something React already does. */}
            <StyleGallery
              key={selected.slug}
              name={selected.name}
              caption={selected.variants[0]?.style ?? ""}
              sources={images[selected.slug] ?? []}
            />

            <div className="p-6 sm:p-8">
              <p className="text-eyebrow uppercase text-accent">
                {selected.category}
              </p>
              {/* tabIndex -1 so the open handler can move focus here without
                  making the heading a tab stop. */}
              <h2
                id="style-title"
                tabIndex={-1}
                className="mt-2 text-h3 font-display text-ink outline-none"
              >
                {selected.name}
              </h2>

              <Parting className="my-6" />

              <ul className="flex flex-col">
                {selected.variants.map((variant) => (
                  <li
                    key={variant.style}
                    className="grid gap-x-6 gap-y-1 border-b border-line py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-baseline"
                  >
                    <div className="min-w-0">
                      <p className="text-body-sm text-ink">{variant.style}</p>
                      <p className="mt-1 text-caption text-ink-muted">
                        {variant.description}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-4 sm:flex-col sm:items-end sm:gap-1">
                      {variant.duration && (
                        <span
                          data-numeric=""
                          className="text-caption text-ink-muted"
                        >
                          {variant.duration}
                        </span>
                      )}
                      <span data-numeric="" className="text-body-sm text-ink">
                        {variant.flatPrice ? "" : "from "}
                        {formatPrice(variant.price)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeStyle}
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-body-sm text-accent transition-colors duration-150 ease-sweep hover:bg-accent-soft"
                >
                  Back to styles
                </button>
                <button
                  type="button"
                  onClick={bookSelected}
                  className="inline-flex h-13 items-center justify-center rounded-pill bg-accent px-8 text-body text-on-accent transition-colors duration-150 ease-sweep hover:bg-accent-hover"
                >
                  Book this style
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

/**
 * The photographs for one style: one enlarged, the rest as a strip beneath it.
 *
 * The strip lists every photograph including the one currently enlarged, not
 * `slice(1)`. Dropping the current one renumbers the strip on every click —
 * thumbnails slide under the pointer and the set appears to lose a photo — and
 * with the first hidden there is no way back to it.
 */
function StyleGallery({
  name,
  caption,
  sources,
}: {
  name: string;
  caption: string;
  sources: string[];
}) {
  const [active, setActive] = useState(0);

  if (sources.length === 0) return null;

  // Guard the index rather than trusting it: `sources` comes from the
  // filesystem, so a photo can disappear between builds.
  const current = sources[active] ?? sources[0];

  return (
    <>
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface-warm">
        <Image
          src={current}
          alt={
            active === 0
              ? `${name} — ${caption}`
              : `${name}, photograph ${active + 1} of ${sources.length}`
          }
          fill
          sizes="(max-width: 640px) 100vw, 38rem"
          className="object-cover"
        />
      </div>

      {sources.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto px-6 pt-4 sm:px-8">
          {sources.map((src, index) => {
            const isActive = index === active;
            return (
              <li key={src} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  // The pressed thumbnail is the one shown above, which is a
                  // toggle state rather than navigation — aria-pressed says
                  // that without claiming the page moved.
                  aria-pressed={isActive}
                  aria-label={`Show photograph ${index + 1} of ${sources.length}`}
                  className={`relative block h-24 w-20 overflow-hidden rounded-sm bg-surface-warm ring-1 transition-[opacity,box-shadow] duration-150 ease-sweep ${
                    isActive
                      ? "ring-2 ring-accent"
                      : "opacity-70 ring-line hover:opacity-100"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/**
 * A card's image, or — where no photograph has been shot yet — a typographic
 * panel of the same shape. Keeps the grid even instead of leaving holes, and a
 * style becomes a photo the moment its file lands in public/images/styles/.
 */
function StyleMedia({
  group,
  src,
  sweep,
}: {
  group: StyleGroup;
  src: string;
  sweep: "left" | "right";
}) {
  return (
    <div
      className={`relative aspect-[3/4] ${sweep === "right" ? "sweep-r" : "sweep"} bg-surface-warm ring-1 ring-line`}
    >
      <Image
        src={src}
        alt={`${group.name}, ${group.variants[0]?.style ?? ""}`}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
      />
    </div>
  );
}
