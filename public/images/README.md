# Images

**`styles/` now holds real photographs of Mirabelle's own work** — 35 shots
across five styles, supplied 2026-07-28. They replaced the stock placeholders.

`hero.webp` and `founder.webp` are still stock and still need replacing.

Multiple photographs per style are supported. Number them and they group
automatically — `knotless-box-braids-01.webp`, `-02`, and so on. The card shows
the first; the style sheet shows the whole set.

Two supplied files are not in use:

- `06-braid-parting-detail-01.webp` — a search bar and "Find related content"
  are burned into the top of the frame. It is a social-media screenshot; needs
  re-exporting from the original.
- (none other)

---

## The stock note below applies only to hero.webp and founder.webp

Every image here is **licensed stock photography copied from
`docs/design/references/`**. None of it shows Mirabelle's own work.

**These must be replaced before the site goes live.** A braiding business sells
its own hands; publishing stock images of other people's braiding undercuts the
entire proposition, regardless of licence.

## Coverage: 7 of 41 styles

There are only nine source photographs. All nine are now in use, each mapped to
a style it **actually depicts** — but that still leaves **34 styles with no
photograph**, which render as typographic cards reading "Photograph coming".

That gap closes only by shooting real work. Nothing in the code needs changing.

If you want a stopgap, `docs/design/references/image-prompts.md` has a
style-accurate generation prompt for every missing style, named so outputs drop
straight in. Read its warnings first — generated hair misrepresents the
portfolio, and braid geometry is the thing image models fail at hardest.

## What is here, and what it genuinely shows

| File | Source | What the photo actually shows |
|---|---|---|
| `hero.webp` | `image1` | Copper box braids, outdoors. 612×240 — the widest crop available |
| `founder.webp` | `2178096518` | **Not the founder.** Studio portrait, cornrows into box braids |
| `styles/knotless-box-braids.webp` | `1474332243` | Fine long knotless braids, honey, waist-length |
| `styles/bohemian-box-braids.webp` | `1499805205` | Auburn braids with loose curled ends — boho |
| `styles/fulani-braids.webp` | `1128762101` | Centre-parted fulani braids with fine parting |
| `styles/lemonade-braids.webp` | `2178093183` | Side-swept cornrows, studio |
| `styles/straight-back-cornrows.webp` | `2276547507` | Clean straight-back cornrows |
| `styles/stitch-braids.webp` | `1314023665` | Neat cornrows with sharp parting |
| `styles/cornrow-ponytail.webp` | `1474333979` | Cornrows gathered into a braided ponytail |

### Deliberately unphotographed

**No source photograph shows twists or locs.** `Senegalese Twists`,
`Butterfly Locs`, `Faux Locs` and the rest therefore have no image rather than a
braid photo pretending to be a twist. A mislabelled photo on a price list is
worse than an honest gap — a client books what they saw.

## Known quality problems

- **The hero is soft.** 612px upscaled across a full-bleed band reads blurry
  above roughly 800px wide.
- **Crops cut the craft.** Sources are 612×408 landscape; cards render 3:4 and
  4:5 portrait, so braid length — the thing being sold — gets cropped away.

## Replacing them

Keep the filenames. Images resolve by service slug
(`slugify(service.name)` in `app/_lib/format.ts`) and the gallery reads this
directory at build time, so dropping a correctly-named file in is the entire
change — no code edit, and it appears on `/menu` automatically.

```
public/images/
  hero.jpg                  2400×1400  landscape, wide establishing shot
  hero-portrait.jpg         1200×1600  optional mobile crop of the same scene
  founder.jpg               1200×1500  portrait 4:5
  styles/<slug>.jpg         1200×1500  portrait 4:5, one per style
```

`.jpg`, `.png`, `.webp` and `.avif` all resolve.

Shooting direction is in `docs/design/references/style-guide.md` §8: profile or
three-quarter framing, natural light, loose crop, and the parting visible.
Portrait 4:5 is not optional — the craft runs down the side of the head.
