# Angelic Braids 5D — scroll-driven landing page

A single-page, scroll-driven motion site for **Angelic Braids 5D**, a premium
braiding atelier in Baltimore, MD. The generated cinematic video is used as one
fixed full-screen background layer for the entire page and is **scrubbed by
scroll position** rather than played.

Every brand decision — colors, typography, copy, section content — is derived
from [`../copy/brand-kit.md`](../copy/brand-kit.md).

---

## Quick start

```bash
cd website
npm install
npm run dev
```

Then open **<http://localhost:5173/>**

### Production build

```bash
npm run build      # outputs to website/dist
npx serve dist     # preview over HTTP at http://localhost:3000
```

> **Do not open `dist/index.html` via `file://`.** ES modules and the video
> range requests both require a real HTTP server.

**Requirements:** Node 20.19+ (built and verified on Node 24.15.0, npm 11.12.1).

---

## How the scroll-scrubbed video works

The video is never played. `src/main.js` maps page scroll progress onto the
video timeline:

```
scroll progress (0 → 1)  ⟶  bgVideo.currentTime (0 → duration)
```

Seeks smaller than `0.008s` are dropped so the decoder isn't thrashed on every
scroll frame.

For this to feel smooth the video must be **all-keyframe encoded**, so any
frame can be decoded without replaying the ones before it.

| | Raw generated file | Shipped `public/bg.mp4` |
|---|---|---|
| Keyframes | 2 of 361 | **360 of 361** |
| Size | 3.95 MB | 10.43 MB |
| Dimensions | 1280×720 | 1280×720 |
| Duration | 15.04s @ 24fps | 15.04s @ 24fps |
| Grade | as generated | **gamma 1.45, sat 1.12, contrast 1.03** |

All-keyframe encoding trades file size for seek performance. That trade is the
whole point here — the 3.95 MB version stutters badly under scrubbing.

### The brightness grade

The raw clip is graded very dark. Behind a scrim it went past "moody" into
unreadable — the braids, the walnut, and the sconce all disappeared, which is
fatal on a site where the work is the product. The gamma lift is baked into
`bg.mp4`, the poster, and the three section WebPs at encode time rather than
applied as a CSS `filter`, because a filter on a full-screen video costs GPU on
every scrubbed frame.

Gamma 1.35 was tested and is slightly richer; 1.6 greys the blacks and loses the
candlelit quality. 1.45 is the chosen balance. Change `$EQ` in
`scripts/swap-bg-video.sh` to re-grade.

### Keeping text readable over a brighter video

Three layers, in order of how much they darken the imagery:

1. `.bg-tint` — light uniform floor (0.24 mid) plus edge vignette.
2. `.bg-tint::after` — a *directional* scrim, heavy on the left where most copy
   sits, clear on the right where the video shows through.
3. `text-shadow` on small body type in full-width grids. The 5D columns, the
   materials cards and the spec table reach past the directional scrim into bare
   video, so they need local separation rather than more global darkening.

Glass panels opt out of (3) — they supply their own ground, and a shadow there
only muddies the type.

### Swapping in a new background video

```bash
# from the project root
bash scripts/swap-bg-video.sh "assets/videos/BRAIDING-scroll-background.mp4"
```

The script encodes to all-keyframe H.264 at **CRF 23**. The project skill
specifies CRF 18, which produces a visually identical result at **15.62 MB** —
60% larger. Edit `CRF` in the script if you want the skill's exact setting.

---

## Structure

```
website/
├─ index.html          all section markup + Google Fonts
├─ src/
│  ├─ main.js          Lenis, ScrollTrigger, video scrub, pins, parallax
│  ├─ style.css        brand tokens, layout, typography, sections
│  └─ glass.css        glass panels, buttons
└─ public/
   ├─ bg.mp4           all-keyframe scroll-scrubbed background
   └─ img/
      ├─ mobile-poster.jpg   still frame — mobile & reduced-motion fallback
      ├─ hero.webp           from BRAND-hero-reference.png
      ├─ material.webp       from BRAND-material-reference.png
      └─ workspace.webp      from BRAND-workspace-reference.png
```

### Layer stack

| Layer | z-index | Role |
|---|---:|---|
| `.bg-video` | 0 | Fixed full-screen video, `object-fit: cover`, scrubbed |
| `.bg-tint` | 1 | Radial + linear darkening for text readability |
| `.motion-glow` | 2 | Slow gilt bloom, 10s cycle |
| `#page` | 10 | All scrolling content |
| `.nav` | 60 | Fixed header |

---

## Sections

| # | ID | Content source in the brand kit |
|---|---|---|
| 1 | `#home` | Name, slogan "Crowned by hand.", positioning (§2, §3) |
| 2 | `#impact` | Brand promise — pinned word-by-word reveal (§3) |
| 3 | `#craft-hair` | Benefit 01 — in-house sourced hair (§9, §10) |
| 4 | `#craft-hand` | Benefit 02 — tension-conscious technique (§9, §10) |
| 5 | `#materials` | Hair, part, foundation, finish (§9, §11) |
| 6 | `#audience` | Five audience cards — pinned gallery (§4) |
| 7 | `#specs` | The 5D Standard + service table (§1, §3, §9) |
| 8 | `#book` | Booking CTA with deposit framing (§3, §12) |
| 9 | `footer` | Minimal brand footer |

### Motion

- **Pinned:** `#impact` (word reveal), `#audience` (one-card-at-a-time gallery)
- **Scrubbed:** background video across the full page
- **Parallax:** section images, `data-parallax="0.12"`
- **Reveals:** batched fade-and-rise, 90ms stagger

---

## Responsive & accessibility

- **Mobile / touch** — video is removed from the DOM (`src` cleared so it never
  downloads), replaced by `mobile-poster.jpg`. Pins are disabled and the
  audience gallery becomes a vertical stack. A tap-to-call button appears in the
  header.
- **`prefers-reduced-motion`** — same fallbacks, plus all reveals resolve to
  their final state and Lenis smoothing is skipped entirely.
- Contrast ratios follow brand kit §6: Ivory on Espresso ≈ 15.9:1, gilt buttons
  carry Deep Noir text (≈ 8.4:1), never white on gold.
- Focus rings are 2px gilt at 2px offset on every interactive element.

---

## Dev hooks

Available in dev only:

```js
window.__bgv.readyState   // 4 when the video is fully buffered
window.__bgv.duration     // 15.041667
window.__lenis            // Lenis instance
window.__ST               // ScrollTrigger
window.__ST.refresh()     // recompute pins after layout changes
```

---

## Placeholder content — replace before launch

The brand kit flags these as unresolved (Appendix A). They are currently
placeholders in the markup:

| What | Where | Note |
|---|---|---|
| Service pricing | `#specs`, `#book` | Brand kit §3 placeholder ranges |
| Discount offers | `#offers` | 20% first-visit and 30% weekday-morning terms are invented — confirm eligibility, exclusions and the off-peak window |
| Address | footer | "Baltimore, Maryland" only |
| Hours | footer | Generic |
| Booking flow | `#book` CTA links to `#book` | Needs a real booking system |
| Gallery | — | No gallery section; needs real client photos with permission |
| Reviews | `#words` | Five **written samples**, not real reviews. Brand kit requires real, attributed ones (Google reviews quoted with attribution) before launch |

Two brand-level items still need your decision before launch: the meaning of
**"5D"** (this build uses the proposed five dimensions) and the
**"Sisterlocks"** trademark question (this build says "microlocs").

---

## Browser verification

Verified in headless Chrome 151 at 1262×568 (a deliberately short viewport —
it exposes vertical collisions that a tall window hides):

- Console clean — no errors or warnings, only Vite HMR debug lines
- `__bgv.duration` 15.041667, `readyState` 4
- Scrub linear across the timeline: 25% → 3.75s, 50% → 7.5s, 100% → 14.99s
- Both pins register; audience pin spans 4852–6488px of a 9439px page
- All five gallery cards render and advance

Three bugs were found and fixed during that pass:

1. **`preload="auto"` blocked the window `load` event.** At ~10 MB the video
   held the page in a loading state for seconds and delayed
   `ScrollTrigger.refresh()`. Now `preload="none"` in markup, upgraded to
   `auto` from JS after `load` fires.
2. **The gallery heading overlapped the cards.** `.workflow__head` was
   absolutely positioned at `18vh` against cards at `top: 54%` — they collided
   on short viewports. The pin is now a flex column, so they cannot overlap at
   any height.
3. **The gallery dimmed to near-nothing between cards.** The falloff
   (`1 - ad/0.6`) put both adjacent cards at ~17% mid-transition. Now a linear
   crossfade where adjacent opacities sum to 1.

## Known gaps

- **The macro phase of the video fills the frame**, so text over the middle of
  the page relies on `.bg-tint` rather than natural negative space. Gallery
  cards carry a heavier background (`rgba(14,10,8,0.76)`) for this reason.
- **Not tested on a real touch device.** The mobile path is exercised by media
  query only.
- **`npm run build -- --base=./`** produces a build whose hashed JS/CSS are
  relative, but `public/` assets are still referenced absolutely (`/bg.mp4`,
  `/img/…`). Serve from a domain root, or rewrite those references if you need
  to deploy under a subpath.
