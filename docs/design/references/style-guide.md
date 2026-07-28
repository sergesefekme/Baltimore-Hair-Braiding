# Mirabelle — Style Guide

The visual language for the Mirabelle braiding site, derived from the nine
reference photographs in this folder.

**Stack it targets:** Next.js 16.2.12 (App Router) · React 19.2.4 ·
Tailwind CSS 4.3.3 · TypeScript 5 · `next/font/google` · `next/image`

---

## 1. What the references actually say

Nine photographs, read as a brief rather than as decoration:

| Reference | Style shown | What it contributes |
|---|---|---|
| `image1` | Copper box braids, green bokeh | Copper as a hero colour; wide banner crop |
| `1128762101` | Fulani braids, city dusk | Geometric parting; cool blue ground |
| `1314023665` | Honey cornrows, corrugated wall | Urban edge; profile-as-portrait |
| `1474332243` | Caramel knotless, wheat field | Golden-hour warmth; deep negative space |
| `1474333979` | Honey braids, high ponytail | Gold jewellery; layered texture |
| `1499805205` | Auburn boho braids, street bokeh | Warm city lights; candid warmth |
| `2178093183` | Lemonade braids, studio white | Clean ground; a single saturated pop |
| `2178096518` | Cornrows to box braids, studio | Parting geometry at its clearest |
| `2276547507` | Straight-back cornrows, sky | Precision line work; open air |

Three things are true across all nine:

**The subject is always in profile or three-quarter, never straight-on.**
The work being sold is on the side and back of the head. Layouts must give
portraits vertical room and lateral breathing space — never crop tight.

**The unifying material is the parting, not a colour.** The fulani, cornrow and
lemonade references are literally precise geometric line work on the scalp.
That geometry — parallel lines whose spacing opens out — is the one thing that
belongs to this business and nobody else. It became the system's signature.

**Settings split warm and cool.** Golden-hour field (`1474332243`,
`1474333979`), against city dusk and studio white (`1128762101`,
`1314023665`, `2178093183`). That split became the two themes.

---

## 2. Colour

### The direction, and what it deliberately avoids

The obvious route for a braiding salon is warm cream with a terracotta accent.
It is also the single most common look in AI-generated design right now, and
it would make Mirabelle indistinguishable from every other salon template.

So the palette inverts the usual weighting:

- **The light ground is a clean studio near-white**, not cream — justified by
  the two studio references, and it lets photography carry the warmth.
- **Wheat is demoted to an accent surface**, used for pull-quotes and wells,
  never as the page background.
- **The dark theme is cool indigo, not neutral black.** It is a different time
  of day — the blue hour of the city references — rather than an inversion.
- **Copper, not terracotta.** Sampled from actual auburn braids.

The warm/cool tension is the concept. Everything else is quiet.

### Named values

| Name | Light | Dark | Role |
|---|---|---|---|
| Ground | `#FBF8F5` | `#15151F` | Page background |
| Surface | `#FFFFFF` | `#1E1E2A` | Cards, sheets |
| Surface warm | `#EFE3D0` | `#2A2A38` | Pull-quotes, wells |
| Ink | `#241A17` | `#F2EDE6` | Body and headings |
| Copper (accent) | `#A8542E` | `#E08B5A` | Primary action, links |
| Honey (highlight) | `#C89440` | `#E8C067` | Graphic accent, rating stars |

### Contrast — measured, not assumed

Every pair below was computed against WCAG 2.1. Two carry real constraints:

| Pair | Ratio | Verdict |
|---|---|---|
| Ink on Ground (light) | 16.07:1 | AAA |
| Ink muted `#6B5B52` on Ground | 6.12:1 | AA |
| Ink subtle `#8A7B71` on Ground | 3.85:1 | **Large text only (≥24px)** |
| Copper on Ground | 5.00:1 | AA |
| Copper on Wheat `#EFE3D0` | 4.17:1 | **Large text only** |
| **Honey `#C89440` on Ground** | **2.56:1** | **FAILS — never body text** |
| Honey deep `#8A6420` on Ground | 5.06:1 | AA — use this for honey-coloured text |
| Ground on Copper (button) | 5.00:1 | AA |
| Ink on Ground (dark) | 15.56:1 | AAA |
| Copper light on Ground (dark) | 6.91:1 | AA |
| Honey light on Ground (dark) | 10.50:1 | AAA |

> **The one rule you must not break:** Honey is a *graphic* colour in the light
> theme — rules, icons, fills, oversized numerals. The moment it becomes text,
> switch to `--mb-highlight-text` (`#8A6420`). In the dark theme honey is
> text-safe at 10.50:1, which is why the token exists in both themes and
> resolves differently.

---

## 3. Typography

Two families, three roles. A third face was considered and cut — the system is
stronger for it.

### Display — **Fraunces**

Chosen for its `SOFT` and `WONK` variable axes. With `WONK` engaged, terminals
slant and swell organically instead of sitting square. That movement echoes the
fall of a braid, and it means the headings carry the brand rather than merely
delivering words. It is emphatically not a neutral face.

Used for `h1`–`h3` and pull-quotes only. Never for UI labels, never below 22px.

### Body and UI — **Archivo**

A grotesque with genuine width range and excellent tabular figures — necessary,
because this site is largely a price list and a booking form. Warm enough not
to fight Fraunces, neutral enough to disappear in a form field.

Deliberately not Inter or Space Grotesk. Both are the reflexive AI choice and
would flatten the pairing.

### Utility role

Archivo again, uppercased, `0.14em` tracking, 11px — for eyebrows, service
durations, and price labels. A separate utility face would have been a third
accessory; tracking and case do the job.

### Loading (`app/fonts.ts`)

```ts
import { Fraunces, Archivo } from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
```

Both are variable fonts, so `wght` is included automatically — `axes` only
needs the *extra* axes. Self-hosted by `next/font`, so no request ever reaches
Google and there is no layout shift.

```tsx
// app/layout.tsx
import { fraunces, archivo } from "./fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${archivo.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

### Scale

Display sizes are fluid, scaling with the viewport and settling at the desktop
size — a fixed 52px title takes the entire first screen on a phone.

| Token | Size | Use |
|---|---|---|
| `text-hero` | 44 → 72px | Homepage hero only |
| `text-h1` | 36 → 52px | Page titles |
| `text-h2` | 30 → 38px | Section headings |
| `text-h3` | 28px | Subsections, service group names |
| `text-h4` | 22px | Card titles |
| `text-lead` | 20px | Intro paragraph under a heading |
| `text-body` | 17px | Default long-form |
| `text-body-sm` | 15px | Dense UI, table cells |
| `text-caption` | 13px | Image credits, helper text |
| `text-eyebrow` | 11px | Uppercase labels, tracked |

Body copy stays at or below **68 characters** per line.

---

## 4. The signature — "the parting"

Five hairlines whose gaps roughly double downward (2 · 4 · 7 · 11 px). It reads
as a scalp parting opening out, and it is the one device this site will be
remembered by.

```
────────────────────────────
────────────────────────────   ← 2px
────────────────────────────   ← 4px

────────────────────────────   ← 7px


────────────────────────────   ← 11px
```

**The progression has to be steep.** An even or gently-widening spacing stops
reading as a parting and becomes a broadsheet hairline rule — one of the exact
generic looks this system exists to avoid. This was caught in review: the first
build used 2·3·4·5px and read as a musical staff.

**Where it appears — and nowhere else:**

1. Between major page sections (`.parting`, full width, 55% opacity)
2. Under the active nav item (`.parting-sm`, copper)
3. On service-row hover, extending left to right

Everything else in the system stays quiet so this stays loud. Do not add a
second decorative motif.

**Portrait treatment.** Images get three crisp 4px corners and one 96px sweep
on the bottom-left (`.sweep`), following the direction braids fall in every
reference. Use `.sweep-r` when the subject faces the other way, so the sweep
always runs *with* the hair, not against it.

---

## 5. Layout

- **Grid:** 12 columns, `72rem` max width, `1.5rem` gutters.
- **Asymmetry by default.** Content sections use a 5/7 or 7/5 split, not
  centred columns — mirroring the off-centre composition of every reference.
- **Negative space is content.** The photographs work because of the room
  around the subject. Section padding is `6rem` mobile, `9rem` desktop.
- **Full-bleed portraits** break the grid deliberately, once per page at most.

---

## 6. Motion

Two durations, no more:

- `--duration-tap` (150ms) — hover, press, focus.
- `--duration-reveal` (600ms) — scroll reveal: 12px rise plus fade, once,
  on portraits and section headings.

Easing is `--ease-sweep`, a decelerating curve that settles rather than bounces.

`prefers-reduced-motion: reduce` collapses everything to 0.01ms — already
handled in `tokens.css`. Do not add motion that bypasses it.

---

## 7. Theme switching

Colour resolves at the token layer, so **components carry no `dark:` colour
classes**. If you reach for `dark:bg-…`, a token is missing — add it to
`tokens.css` instead.

`tokens.css` honours `prefers-color-scheme` and lets an explicit
`data-theme` attribute override it in both directions. To offer a manual
toggle, set the attribute on `<html>` before first paint:

```tsx
// app/layout.tsx — inside <head>, before content renders
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}})()`,
  }}
/>
```

Without this, a toggle will flash the wrong theme on load.

---

## 8. Photography direction

The reference images are stock and **must be replaced with Mirabelle's own
work before launch** — a braiding business sells its own hands. Shoot to match:

- Profile or three-quarter, never straight-on.
- Natural light; golden hour outdoors or clean white indoors. Nothing mixed.
- Frame loose. Leave a third of the image empty.
- Show the parting. The scalp geometry is the craft.
- Every style the price list names needs at least one real photograph.

Serve through `next/image` with `sizes` set, `priority` on the hero only, and
descriptive `alt` naming the style ("Knotless box braids, mid-back length").

---

## 9. Voice

Plain, warm, specific. The reader is deciding whether to trust someone with
four hours and £120.

- Say what a service is and how long it takes. "Knotless box braids · 4–5 hrs ·
  from £120", not "Transform your look."
- Buttons state the outcome: **Book this style**, not *Submit*. The
  confirmation then says **Booked**.
- Errors say what went wrong and what to do: "That slot was taken a moment ago.
  Pick another time below." Never apologise, never be vague.
- Empty states invite: "No styles saved yet. Browse the gallery to start a
  list."
- Sentence case everywhere except eyebrow labels.

---

## 10. Accessibility floor

Non-negotiable, and cheaper to build in than retrofit:

- Contrast per §2, including the two large-text-only constraints.
- Visible focus on every interactive element (branded copper, already in base).
- Full keyboard operation of nav, gallery lightbox, and the booking flow.
- `alt` on every photograph; decorative rules marked `aria-hidden`.
- Reduced motion respected.
- Tap targets ≥ 44×44px.
- Form fields have real `<label>`s — never placeholder-as-label.
