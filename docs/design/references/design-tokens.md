# Mirabelle — Design Tokens

Reference for every token in [`tokens.css`](./tokens.css). That file is the
implementation; this one explains it.

**Target:** Tailwind CSS 4.3.3 · Next.js 16.2.12

---

## How the layers work

```
PRIMITIVES          --mb-copper-500: #A8542E
   ↓                Raw palette. Never referenced in a component.
SEMANTICS           --mb-accent: var(--mb-copper-500)
   ↓                What the thing IS. Flips per theme.
TAILWIND (@theme)   --color-accent: var(--mb-accent)
   ↓                Generates utilities.
COMPONENT           class="bg-accent text-on-accent"
```

Two rules follow from this, and they matter:

1. **Never use a primitive in a component.** `bg-[#A8542E]` and
   `text-copper-500` both break theming. Use `bg-accent`.
2. **Never write a `dark:` colour class.** Colour is resolved before Tailwind
   sees it, so `bg-surface` is already correct in both themes. If a component
   needs `dark:bg-…`, the token is missing — add it.

---

## Colour primitives

Sampled directly from the reference photographs in this folder.

### Espresso — deepest hair tones

| Token | Hex | |
|---|---|---|
| `--mb-espresso-900` | `#241A17` | ██ Primary ink (light) |
| `--mb-espresso-700` | `#3D2C26` | ██ Hover ink |
| `--mb-espresso-500` | `#6B5B52` | ██ Muted text |
| `--mb-espresso-300` | `#8A7B71` | ██ Subtle text (large only) |
| `--mb-espresso-100` | `#D8CDC4` | ██ Disabled |

### Dusk — city blue hour, corrugated wall

| Token | Hex | |
|---|---|---|
| `--mb-dusk-900` | `#15151F` | ██ Ground (dark) |
| `--mb-dusk-800` | `#1E1E2A` | ██ Surface (dark) |
| `--mb-dusk-700` | `#2A2A38` | ██ Raised surface |
| `--mb-dusk-600` | `#3A3A4B` | ██ Borders (dark) |
| `--mb-dusk-300` | `#877F8C` | ██ Subtle text (dark) |
| `--mb-dusk-200` | `#A9A2AE` | ██ Muted text (dark) |
| `--mb-dusk-100` | `#F2EDE6` | ██ Ink (dark) |

### Copper — auburn braids · the accent

| Token | Hex | |
|---|---|---|
| `--mb-copper-700` | `#7D3D21` | ██ Hover (light) |
| `--mb-copper-500` | `#A8542E` | ██ Accent (light) |
| `--mb-copper-300` | `#E08B5A` | ██ Accent (dark) |
| `--mb-copper-100` | `#F7DDCD` | ██ Soft fill |

### Honey — caramel braids, gold jewellery

| Token | Hex | |
|---|---|---|
| `--mb-honey-700` | `#8A6420` | ██ Text-safe honey |
| `--mb-honey-500` | `#C89440` | ██ Graphic only (light) |
| `--mb-honey-300` | `#E8C067` | ██ Highlight (dark) |
| `--mb-honey-100` | `#F8ECD4` | ██ Soft fill |

### Wheat & Chalk — field and studio grounds

| Token | Hex | |
|---|---|---|
| `--mb-wheat-200` | `#EFE3D0` | ██ Warm surface |
| `--mb-wheat-100` | `#F6EEE1` | ██ Sunk surface |
| `--mb-chalk-50` | `#FBF8F5` | ██ Ground (light) |
| `--mb-chalk-0` | `#FFFFFF` | ██ Surface (light) |

### State

Held apart from copper and honey so "confirmed" never reads as "brand".

| Token | Hex | |
|---|---|---|
| `--mb-green-600` / `-300` | `#2F6F52` / `#63BE93` | ██ Confirmed |
| `--mb-red-600` / `-300` | `#9E2F3D` / `#F2808F` | ██ Error, cancelled |

---

## Semantic tokens

| Semantic | Tailwind utility | Light | Dark |
|---|---|---|---|
| `--mb-ground` | `bg-ground` | `#FBF8F5` | `#15151F` |
| `--mb-surface` | `bg-surface` | `#FFFFFF` | `#1E1E2A` |
| `--mb-surface-warm` | `bg-surface-warm` | `#EFE3D0` | `#2A2A38` |
| `--mb-surface-sunk` | `bg-surface-sunk` | `#F6EEE1` | `#2A2A38` |
| `--mb-ink` | `text-ink` | `#241A17` | `#F2EDE6` |
| `--mb-ink-muted` | `text-ink-muted` | `#6B5B52` | `#A9A2AE` |
| `--mb-ink-subtle` | `text-ink-subtle` | `#8A7B71` | `#877F8C` |
| `--mb-ink-inverse` | `text-ink-inverse` | `#FBF8F5` | `#15151F` |
| `--mb-line` | `border-line` | `#E6DDD4` | `#3A3A4B` |
| `--mb-line-strong` | `border-line-strong` | `#241A17` | `#F2EDE6` |
| `--mb-accent` | `bg-accent` `text-accent` | `#A8542E` | `#E08B5A` |
| `--mb-accent-hover` | `hover:bg-accent-hover` | `#7D3D21` | `#F7DDCD` |
| `--mb-accent-soft` | `bg-accent-soft` | `#F7DDCD` | `#2F2019` |
| `--mb-on-accent` | `text-on-accent` | `#FBF8F5` | `#15151F` |
| `--mb-highlight` | `text-highlight` | `#C89440` | `#E8C067` |
| `--mb-highlight-text` | `text-highlight-text` | `#8A6420` | `#E8C067` |
| `--mb-confirmed` | `text-confirmed` | `#2F6F52` | `#63BE93` |
| `--mb-attention` | `text-attention` | `#8A6420` | `#E8C067` |
| `--mb-error` | `text-error` | `#9E2F3D` | `#F2808F` |
| `--mb-focus` | `ring-focus` | `#A8542E` | `#E08B5A` |

### Verified contrast

Computed against WCAG 2.1. **Two constraints are load-bearing:**

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `ground` (light) | 16.07:1 | AAA |
| `ink-muted` on `ground` | 6.12:1 | AA |
| `ink-subtle` on `ground` | 3.85:1 | ⚠ **≥24px only** |
| `accent` on `ground` | 5.00:1 | AA |
| `accent` on `surface-warm` | 4.17:1 | ⚠ **≥24px only** |
| `highlight` on `ground` (light) | 2.56:1 | ⛔ **Never text** |
| `highlight-text` on `ground` | 5.06:1 | AA |
| `on-accent` on `accent` | 5.00:1 | AA |
| `ink` on `ground` (dark) | 15.56:1 | AAA |
| `ink-muted` on `ground` (dark) | 7.31:1 | AAA |
| `ink-subtle` on `ground` (dark) | 4.70:1 | AA |
| `accent` on `ground` (dark) | 6.91:1 | AA |
| `highlight` on `ground` (dark) | 10.50:1 | AAA |

---

## Typography

Display sizes are fluid — a fixed 52px `h1` swallows the whole first screen on
a 390px phone. They scale with the viewport and settle at the desktop size.

| Token | Size | Line height | Tracking |
|---|---|---|---|
| `text-hero` | 44 → 72px | 0.98 | −0.035em |
| `text-h1` | 36 → 52px | 1.05 | −0.028em |
| `text-h2` | 30 → 38px | 1.15 | −0.018em |
| `text-h3` | 28px | 1.25 | −0.01em |
| `text-h4` | 22px | 1.3 | — |
| `text-lead` | 20px | 1.55 | — |
| `text-body` | 17px | 1.65 | — |
| `text-body-sm` | 15px | 1.55 | — |
| `text-caption` | 13px | 1.45 | — |
| `text-eyebrow` | 11px | 1.2 | +0.14em |

Families: `font-display` (Fraunces) · `font-sans` (Archivo).

Numerals in prices, durations and dates need `data-numeric` on the element —
base CSS applies `font-variant-numeric: tabular-nums` so columns align.

---

## Radius

| Token | Value | Use |
|---|---|---|
| `rounded-xs` | 2px | Focus ring inset, chips |
| `rounded-sm` | 3px | Inputs, small buttons |
| `rounded-md` | 4px | Cards, standard buttons |
| `rounded-sweep` | 96px | **PortraitFrame only** — one corner |
| `rounded-pill` | 999px | **BookingCta only** as a button shape; see note |

`rounded-pill` is reserved so the booking CTA stays the only pill-shaped
control and therefore instantly findable. That reservation is about *shape*,
not the token: small circular indicators — loading spinners, status dots —
may use it, because at 16px a circle reads as a circle and competes with
nothing. `Button`'s spinner is the standing example.

Radius is restrained on purpose. `rounded-lg` everywhere is a hallmark of
templated design; here the curve is spent in one place, on the portraits.

---

## Spacing & motion

| Token | Value |
|---|---|
| `gutter` | 1.5rem |
| `section` | 6rem (mobile) |
| `section-lg` | 9rem (desktop) |
| `--duration-tap` | 150ms |
| `--duration-reveal` | 600ms |
| `--ease-sweep` | `cubic-bezier(0.22, 1, 0.36, 1)` |

---

## Custom utilities

Defined with Tailwind v4's `@utility` directive.

| Utility | What it draws |
|---|---|
| `parting` | The signature — 5 hairlines, gaps doubling 2·4·7·11px, 29px tall |
| `parting-sm` | Condensed 3-line variant, gaps 2·4px, copper, 9px tall |
| `sweep` | 4px corners with a 96px sweep bottom-left |
| `sweep-r` | Mirrored — sweep bottom-right |
| `reveal` | 12px rise + fade, 600ms, reduced-motion safe |

---

## Base element styles worth knowing

Two global rules in `tokens.css` exist to undo things Tailwind's preflight
breaks or leaves unset. Both are easy to reintroduce as bugs if the file is
ever regenerated:

- **`dialog { margin: auto }`** — native `<dialog>` centres itself through
  `margin: auto` in the UA stylesheet. Preflight zeroes margin on every
  element, which silently pins every modal to the top-left corner. Also caps
  `max-height: 85svh` with `overflow: auto` so a long sheet scrolls inside
  itself rather than off-screen.
- **`dialog::backdrop`** — a fixed dark overlay per theme. Not a token, because
  it must stay dark in *both* themes; any token that flips would turn the
  overlay pale on a dark page.

## Installing

Replace the contents of `app/globals.css` with `tokens.css`, then create
`app/fonts.ts` and wire the variables in `app/layout.tsx` — both snippets are
in [`style-guide.md` §3](./style-guide.md#loading-appfontsts).

The generated `app/globals.css` currently sets
`font-family: Arial, Helvetica, sans-serif` on `body`, which overrides the
Geist variables it also declares. Replacing the file wholesale removes that bug
along with the unused `--font-geist-*` tokens.
