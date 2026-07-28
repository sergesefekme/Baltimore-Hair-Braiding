# Mirabelle — Component Specification

Components for the Mirabelle braiding site, specified against
**Next.js 16.2.12 App Router · React 19.2.4 · Tailwind 4.3.3 · TypeScript 5**.

Tokens come from [`tokens.css`](./tokens.css); rationale in
[`style-guide.md`](./style-guide.md).

---

## Conventions

**Server by default.** Every component here is a React Server Component unless
marked ⚡. Add `"use client"` only for the ones that are.

**No `dark:` colour classes.** Colour resolves at the token layer. `bg-surface`
is already correct in both themes.

**Proposed location:** `app/_components/`. The App Router treats
underscore-prefixed folders as private, so they never become routes.

**Props extend native elements** so `className`, `aria-*` and event handlers
pass through:

```ts
type ButtonProps = React.ComponentProps<"button"> & { variant?: Variant };
```

**Composition over configuration.** A card takes `children`, not fifteen props.

---

## 1. Foundations

### `Parting` — the signature divider

The one memorable device in the system. Purely decorative, so it is hidden
from assistive tech.

```tsx
type PartingProps = {
  size?: "default" | "sm";
  className?: string;
};
```

```tsx
export function Parting({ size = "default", className = "" }: PartingProps) {
  return (
    <div
      aria-hidden="true"
      className={`${size === "sm" ? "parting-sm" : "parting"} ${className}`}
    />
  );
}
```

**Use:** between major sections, under active nav, on service-row hover.
**Never:** more than once per section; as page decoration; alongside any other
divider style.

---

### `SectionHeader`

```ts
type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "start" | "center";  // default "start" — asymmetry is the house style
};
```

Layout: eyebrow (11px, uppercase, `+0.14em`, `text-accent`) → title
(`text-h2 font-display`) → lead (`text-lead text-ink-muted`, max `52ch`).

Centre alignment is available but should be rare — the references are all
off-centre compositions.

---

### `Container`

```ts
type ContainerProps = React.ComponentProps<"div"> & {
  width?: "default" | "narrow" | "bleed";
};
```

| Width | Classes |
|---|---|
| `default` | `mx-auto w-full max-w-[72rem] px-6` |
| `narrow` | `mx-auto w-full max-w-[46rem] px-6` — long-form copy |
| `bleed` | `w-full` — full-bleed portraits only, max once per page |

---

## 2. Actions

### `Button`

```ts
type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};
```

| Variant | Resting | Hover | Notes |
|---|---|---|---|
| `primary` | `bg-accent text-on-accent` | `bg-accent-hover` | One per view |
| `secondary` | `border border-line-strong text-ink bg-transparent` | `bg-surface-warm` | Default choice |
| `ghost` | `text-accent` | `bg-accent-soft` | Tertiary, inline |

| Size | Height | Padding | Type |
|---|---|---|---|
| `sm` | 36px | `px-3.5` | `text-body-sm` |
| `md` | 44px | `px-5` | `text-body-sm` |
| `lg` | 52px | `px-7` | `text-body` |

All sizes meet the 44px tap target except `sm`, which is **desktop-only** —
do not use it in mobile layouts.

- Radius `rounded-md`. Transition `--duration-tap`.
- `loading` sets `aria-busy`, disables the button, and swaps the label for a
  spinner while preserving width (avoids layout shift).
- Disabled: `opacity-50 cursor-not-allowed`, never a colour-only signal.
- Labels state the outcome — **Book this style**, not *Submit*.

---

### `BookingCta` ⚡

The single pill in the system. Its shape is what makes it findable.

```ts
type BookingCtaProps = {
  service?: string;      // pre-selects a style in the booking flow
  children?: React.ReactNode;
};
```

`rounded-pill h-13 px-8 bg-accent text-on-accent text-body`. Sticky on mobile
(`fixed bottom-4 inset-x-4 z-40`), inline on desktop. Client component because
it carries the sticky-scroll behaviour.

---

## 3. Navigation

### `SiteHeader` ⚡

Sticky, `bg-ground/85 backdrop-blur-md`, `border-b border-line`.

- Wordmark left in `font-display`, 22px.
- Links: Styles · Gallery · About · Contact.
- Active link gets `<Parting size="sm" />` beneath it — the only active-state
  treatment. No pills, no background fills.
- Right: `BookingCta` (desktop only — mobile uses the sticky version).
- Below `md`: hamburger opening a full-screen sheet. Trap focus, close on
  `Escape`, restore focus to the trigger, lock body scroll.

### `SiteFooter`

Three columns collapsing to one below `md`, on `bg-surface-warm`:
contact and address · opening hours (`data-numeric`) · social and policies.
`Parting` above it.

---

## 4. Services and pricing

The commercial core of the site. Accuracy and scannability beat decoration.

> **Superseded.** `ServiceRow` and `ServiceGroup` below were built, shipped, and
> then removed when `/menu` and `/services` were merged into one image-led page.
> `/services` now 308-redirects to `/menu`. The specs are kept because the
> layout rules still apply to the style sheet inside `MenuBrowser` — the
> component names no longer exist in `app/_components/`.

### `MenuBrowser` ⚡

```ts
type MenuBrowserProps = {
  groups: StyleGroup[];          // one entry per style name, with variants
  categories: string[];
  images: Record<string, string>; // slug → path; a plain object, not a Map,
                                  // because Maps do not cross the RSC boundary
};
```

The merged menu. Category filter chips (`aria-pressed`, never colour alone),
a live-region count, and a grid of style cards. A card opens a modal sheet
listing every price variant with its duration, plus a **Book this style**
button that closes the sheet and opens the booking form pre-filled.

Cards come in two forms and the grid stays even either way: a photograph where
`public/images/styles/<slug>.*` exists, and a **generative parting panel** where
it does not. The panel shows the *category*, never the style name — the heading
directly beneath already names it, and repeating it reads as a bug.

Labels sit **top-left**: the 96px sweep is on a bottom corner and clips anything
within ~96px of it.

### `PartingPattern`

```ts
type PartingPatternProps = { seed: string; className?: string };
```

SVG rows of curved lines whose gaps widen as they fall — the signature motif
scaled from a divider up to a full panel. Geometry (line count 7–11, sweep
direction, curve family, spacing growth) derives deterministically from the
style slug, so every card differs and the same style always draws the same
pattern.

The point is that a style without a photograph gets **artwork, not an
apology**. There is no "photograph coming" label; a parting is the craft being
sold, so the panel is on-subject rather than a placeholder.

> **Use `>>>`, never `>>`.** A signed right shift on a hash with the top bit set
> returns a negative number; `% 3` then yields `-1`, indexing the amplitude
> table gives `undefined`, and `NaN` propagates into the path `d` — rendering a
> blank card. Two of the 34 styles hit exactly that.

**Deep-linking.** `?style=<slug>` opens that style's sheet, so a style is
shareable and the homepage's featured tiles link straight to it. The URL is the
single source of truth — nothing mirrors it into state, so a pasted link, a card
click and the Back button all follow the same path.

Two implementation constraints, both load-bearing:

- **Not `useSearchParams`.** On a prerendered route it forces everything up to
  the nearest Suspense boundary to be client-rendered only, which would strip
  all 41 cards out of `/menu`'s static HTML. `app/_lib/url.ts` wraps the native
  History API instead — supported by the App Router, and the route stays `○`.
- **`useSyncExternalStore`, not `useState` + an effect.** The URL is external
  mutable state; mirroring it into React state is what that hook exists to
  replace, and doing it in an effect trips `react-hooks/set-state-in-effect`.

Closing steps *back* when the sheet was opened by a card click, and strips the
parameter with `replaceState` when the visitor arrived by link — otherwise
Escape on a deep link would navigate them off the site. An unrecognised slug
renders the plain grid.

### `ServiceRow`

```ts
type ServiceRowProps = {
  service: Service;        // from app/_lib/services.ts
  href: string;
  currency?: string;       // default "GBP"
};
```

Takes the whole `Service` rather than six loose props — the row renders every
field of it, and keeping them together stops the call site drifting from the
data. `Service` carries `name`, `style`, `description`, `duration`, `price` and
`flatPrice`.

> **Built and shipped.** `app/_components/ServiceRow.tsx`.
> Duration is not a column in `items.csv` — it is written as a closing sentence
> in the menu copy ("Allow 4-5 hours.") and lifted out in the data layer, which
> degrades quietly to no duration when the sentence is absent. Promoting it to
> a real CSV column would be cleaner and is the obvious next tidy-up.

Layout — a single row, not a card:

```
Knotless box braids                    4–5 hrs        from £120
Hair not included
────────────────────────────────────────────────────────────────
```

- Name `text-h4 font-display`; duration and price `text-body-sm` with
  `data-numeric` so columns align; note `text-caption text-ink-muted`.
- Separated by `border-b border-line` — **not** the parting rule. The parting
  is reserved for section breaks.
- Hover: `parting-sm` animates in beneath the row, left to right, 150ms.
- The whole row is one link. Minimum height 64px.
- Price renders as "from £120" — never a bare number, because braiding prices
  vary by length and the copy must not overpromise. Categories flagged
  `flatPrice` (Maintenance, Add-Ons) drop the "from", since a scalp treatment
  does not vary.
- Hover is gated behind `@media (hover: hover)` so touch devices get no sticky
  hover state; `group-focus-within` sits outside that gate, so keyboard users
  still get the parting.

### `ServiceGroup`

```ts
type ServiceGroupProps = {
  category: ServiceCategory;
  hrefFor?: (service: Service) => string;   // default: /book?style=<slug>
};
```

Groups rows under a category heading, laid out on the house 5/7 asymmetric
split. On `lg` and above the heading column is `sticky`, so you always know
which group you are reading once a long list scrolls past. Below `lg` it
stacks.

> **Built and shipped.** `app/_components/ServiceGroup.tsx`, which also exports
> `slugify` for anchors and route segments.

### `StyleChip`

```ts
type StyleChipProps = {
  label: string;
  selected?: boolean;
};
```

Filter chips for the gallery. Resting `border border-line text-ink-muted`;
selected `bg-accent-soft border-accent text-accent`. `rounded-xs`, 32px tall,
`text-eyebrow` uppercase. Selected state must also set `aria-pressed` — colour
alone is not a signal.

---

## 5. Imagery

### `PortraitFrame`

The house image treatment. Three crisp corners, one long sweep.

```ts
type PortraitFrameProps = {
  src: string;
  alt: string;              // required — describe the style
  sweep?: "left" | "right"; // default "left"
  priority?: boolean;       // hero only
  sizes?: string;
  caption?: string;
};
```

```tsx
<figure className={sweep === "right" ? "sweep-r" : "sweep"}>
  <Image
    src={src}
    alt={alt}
    fill
    sizes={sizes ?? "(max-width: 768px) 100vw, 50vw"}
    priority={priority}
    className="object-cover"
  />
</figure>
```

- Aspect ratio `4/5` default, `3/4` in grids. Never square — the references are
  all vertical and the craft is on the side of the head.
- **The sweep must run with the hair.** Subject facing right → `sweep="left"`.
  Getting this backwards fights the photograph.
- `alt` names the style: `"Knotless box braids, mid-back length, honey"`.
- `priority` on the hero image only; everything else lazy-loads.
- Optional `caption` renders `text-caption text-ink-muted` beneath.

### `GalleryGrid` ⚡

Masonry-ish 2 / 3 / 4 columns (mobile / `md` / `lg`) using CSS columns to
preserve varied portrait heights. Each item is a `PortraitFrame` inside a
button that opens the lightbox.

**Lightbox requirements** — these are correctness, not polish:
`role="dialog"` + `aria-modal`, focus trapped, `Escape` closes, arrow keys
navigate, focus returns to the originating thumbnail, body scroll locked,
swipe-to-dismiss on touch.

Reveal: `reveal` utility, staggered 60ms per item, capped at 8 items so the
last row does not crawl.

---

## 6. Social proof

### `Testimonial`

On `bg-surface-warm`, `Container width="narrow"`.

- Quote in `font-display text-h3`, `text-wrap: balance`, max `40ch`.
- Attribution `text-eyebrow uppercase text-ink-muted`.
- Optional style credit links to that service: "Wore knotless box braids".
- No quotation-mark ornament, no avatar ring, no card border. The type is
  enough — this is where restraint pays for the signature elsewhere.

### `Rating`

Stars use `text-highlight` (honey) as **fill only**. The numeric value beside
them must use `text-highlight-text` or `text-ink` — honey fails contrast as
text in the light theme. Always render the value as text too
(`4.9 out of 5, 87 reviews`); never rely on the star graphic alone.

---

## 7. Booking and forms

### `Field`

```ts
type FieldProps = {
  label: string;          // required — never a placeholder in its place
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactElement;
};
```

Renders `<label>` (`text-eyebrow uppercase`) → control → hint
(`text-caption text-ink-muted`) or error (`text-caption text-error`).
Wires `id`, `aria-describedby` and `aria-invalid` onto the child automatically.

### `Input` / `Select` / `Textarea`

`h-11 bg-surface-sunk border border-line rounded-sm px-3.5 text-body-sm`.
Focus `outline-2 outline-focus outline-offset-2`. Error `border-error`.
Placeholders are examples only ("07700 900123"), never the label.

### `DateTimePicker` ⚡

- Month grid; unavailable days `text-ink-subtle` with `aria-disabled`, not
  hidden — absence should be visible.
- Selected day `bg-accent text-on-accent`.
- Times as a chip grid, `data-numeric`.
- Keyboard: arrows move by day, `PageUp`/`PageDown` by month, `Enter` selects.
- Announce the selection via a live region.
- **State the deposit before the confirm step.** "£30 deposit, taken now.
  Balance on the day." Surprising someone at the payment screen loses bookings.

### `Alert`

```ts
type AlertProps = {
  tone: "confirmed" | "attention" | "error";
  title: string;
  children?: React.ReactNode;
};
```

Left border 3px in the tone colour, `bg-surface`, tone-coloured icon plus a
tone-coloured **word** — colour is never the only carrier. Errors say what
happened and what to do next: *"That slot was taken a moment ago. Pick another
time below."*

---

## 8. Content

### `FaqAccordion` ⚡

Native `<details>`/`<summary>` — free keyboard and screen-reader behaviour.
Question `text-h4 font-display`; chevron rotates 150ms. `border-b border-line`
between items. Answers hold real detail: hair supplied, deposit terms, lateness
policy, takedown, aftercare.

### `Prose`

Wrapper for CMS rich text (Sanity Portable Text). Sets `max-w-[68ch]`,
`text-body`, `text-ink`; headings to `font-display`; links `text-accent
underline underline-offset-4`; `text-wrap: pretty` on paragraphs.

---

## Build order

Foundations gate everything else, and the booking flow is the only part that
earns money.

1. `tokens.css` → `app/globals.css`, `app/fonts.ts`, layout wiring
2. `Container`, `Parting`, `SectionHeader`, `Button`
3. `SiteHeader`, `SiteFooter`
4. `PortraitFrame` — needed before any page looks real
5. `ServiceRow`, `ServiceGroup` (the price list is the most-visited page)
6. `GalleryGrid` + lightbox
7. `Field`, `Input`, `Select`, `Alert`
8. `DateTimePicker`, `BookingCta`, deposit flow
9. `Testimonial`, `Rating`, `FaqAccordion`, `Prose`

---

## Definition of done

A component ships when:

- [ ] It renders correctly in both themes with **no `dark:` colour classes**
- [ ] Contrast meets §2 of the style guide, including the honey constraint
- [ ] Keyboard-operable, with visible focus
- [ ] Works at 360px wide without horizontal scroll
- [ ] Honours `prefers-reduced-motion`
- [ ] Interactive targets ≥ 44×44px on mobile
- [ ] No colour-only state signals
- [ ] Uses semantic tokens, never primitives or arbitrary hex
