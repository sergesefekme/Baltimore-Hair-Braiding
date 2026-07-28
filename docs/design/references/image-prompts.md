# Image generation prompts — 34 missing styles

Prompts for the styles that have no photograph. Paste into Midjourney, Gemini,
DALL·E or similar, then save each output under the **exact filename given** —
the site resolves images by slug, so a correctly-named file appears on `/menu`
with no code change.

---

## Read this first

**These are a stopgap, not a substitute.** A price list is a portfolio: clients
book the style they saw. Generated hair is not work Mirabelle did, which is the
same objection that applies to the stock photos currently in `public/images/`.

**Braids are the specific thing image models are worst at.** Expect to reject
most outputs. The recurring failures:

- Braid count changes between root and tip
- Braids that melt into each other or terminate in nothing
- Parting lines that do not connect to the braids growing from them
- Scalp geometry that is impossible — cornrows crossing without interleaving
- Hands with the wrong number of fingers in any process shot

A braiding clientele spots all of this instantly. **Reject anything where the
parting does not read as real**, because the parting is what the craft is judged
on. If you cannot get a clean result in a few attempts, leave the typographic
card — it is more honest than a wrong picture.

---

## Shared preamble

Prefix every prompt with this so the set coheres as one shoot:

> Editorial beauty photograph of a Black woman, three-quarter rear or profile
> view showing the side and back of the head, natural soft daylight, shallow
> depth of field, muted warm background, calm neutral expression, shot on 85mm,
> photorealistic, no text, no watermark —

And append:

> — vertical 4:5 portrait crop, subject off-centre with generous negative space,
> scalp parting sharply in focus, minimum 1200×1500

**Negative prompt** (or "avoid" clause):

> avoid: melted or fused braids, inconsistent braid count, floating braids not
> attached to the scalp, impossible parting lines, extra fingers, distorted
> hands, plastic skin, oversaturated colour, studio flash, text overlays

---

## Box Braids

**`styles/classic-box-braids.jpg`**
> Medium-thickness classic box braids to mid-back, clearly visible **square**
> parting sections across the scalp, sealed knot at each root, jet black,
> uniform braid width from root to tip.

**`styles/triangle-part-box-braids.jpg`**
> Medium box braids with distinctly **triangular** parting sections forming a
> sharp geometric pattern across the crown, dark brown, mid-back length. The
> triangular sections must be the clear focal point.

**`styles/goddess-box-braids.jpg`**
> Medium box braids with loose **wavy human-hair pieces left out** along the
> length, honey-brown, soft undone movement, mid-back length.

## Cornrows

**`styles/feed-in-cornrows.jpg`**
> Feed-in cornrows running straight back, each row starting **very fine at the
> hairline and thickening** along its length as hair is added, eight to ten
> rows, natural black, ending in loose braids past the shoulder.

**`styles/freestyle-cornrow-design.jpg`**
> Freestyle cornrows in a **curved swirling pattern** across the scalp, rows
> sweeping in arcs rather than straight lines, intricate parting, natural black,
> close three-quarter rear view emphasising the pattern.

## Twists

**`styles/senegalese-twists.jpg`**
> Senegalese twists — smooth **two-strand rope twists** with a silky sheen,
> medium thickness, mid-back length, dark brown. Rope-like spiral clearly
> visible; these are twists, not braids.

**`styles/marley-twists.jpg`**
> Marley twists — chunky **matte textured** two-strand twists using coarse
> Marley hair, natural black, mid-back, visibly fluffier and less shiny than
> Senegalese twists.

**`styles/passion-twists.jpg`**
> Passion twists — springy **wet-look curly** two-strand twists, medium
> thickness, shoulder length, dark brown with a defined curl pattern through
> each twist.

**`styles/havana-twists.jpg`**
> Havana twists — **large, chunky, lightweight** two-strand twists, noticeably
> thicker and fewer than Senegalese, natural black, mid-back length.

**`styles/kinky-twists.jpg`**
> Kinky twists — **small, fine** two-strand twists with a coily afro texture,
> shoulder length, natural black, blending closely with the natural hairline.

**`styles/flat-twists.jpg`**
> Flat twists — two-strand twists lying **flat against the scalp** in neat rows,
> the client's own natural hair with no extensions, natural black, close
> three-quarter view showing the scalp rows.

**`styles/twist-out-set.jpg`**
> A twist-out — twists unravelled into **full defined springy curls**, natural
> black 4C hair, voluminous, shoulder length, soft daylight showing curl
> definition.

## Loc Styles

**`styles/starter-locs.jpg`**
> Starter locs — small neat **comb coils** across the whole head, tight uniform
> coils at the very beginning of the loc journey, natural black, close
> three-quarter view showing the parting grid.

**`styles/loc-retwist.jpg`**
> Mature shoulder-length locs with **freshly retwisted clean roots**, crisp
> square parting grid clearly visible across the scalp, natural black, no style
> — just the clean loc line.

**`styles/loc-retwist-and-style.jpg`**
> Mature locs freshly retwisted and set into **barrel rolls pinned into an
> updo**, natural black, elegant, three-quarter rear view showing the roll
> structure.

**`styles/interlocking.jpg`**
> Interlocked locs — roots tightened with the interlocking method giving a
> **flatter, woven root** rather than a twisted one, fine locs, natural black,
> close view of the root area.

**`styles/faux-locs.jpg`**
> Faux locs — smooth **wrapped temporary locs** with a clean even surface,
> mid-back length, dark brown, each loc uniform in thickness.

**`styles/butterfly-locs.jpg`**
> Butterfly locs — distressed faux locs with **visible loose loops** of hair
> along the length giving a deliberately messy texture, medium thickness,
> mid-back, dark brown.

**`styles/soft-locs.jpg`**
> Soft locs — lightweight faux locs with a **natural lived-in matte finish**,
> waist length, dark brown, hanging softly with no tension at the root.

**`styles/loc-repair.jpg`**
> Close detail of a stylist's hands repairing a **thinning loc at the root**,
> shallow focus on the hands and the single loc, salon setting softly blurred.
> Hands must be anatomically correct.

## Crochet

**`styles/crochet-braids.jpg`**
> Crochet braids — pre-looped curly hair **crocheted into a cornrow base**,
> full and voluminous, shoulder length, dark brown, with a glimpse of the
> cornrow foundation at the parting.

**`styles/crochet-faux-locs.jpg`**
> Crochet faux locs — locs **installed by crochet** into a cornrow base,
> medium thickness, mid-back length, natural black, lighter and more open at
> the root than wrapped locs.

## Kids

Use "a young Black girl aged around eight" in place of the preamble's subject,
and keep every image plainly non-sexualised, simply framed and warm.

**`styles/kids-cornrows.jpg`**
> Six to eight neat straight-back cornrows on a young girl's natural hair, no
> extensions, natural black, gentle low tension at the hairline, bright soft
> daylight.

**`styles/kids-box-braids.jpg`**
> Shoulder-length knotless box braids on a young girl, medium thickness,
> natural black, a few colourful beads at the ends.

**`styles/kids-twists-with-beads.jpg`**
> Two-strand twists on a young girl finished with **colourful beads and metal
> cuffs**, natural black hair, cheerful, beads clearly in focus.

**`styles/kids-cornrow-ponytail.jpg`**
> Cornrows on a young girl gathered into a single neat **braided ponytail** at
> the back, natural black, tidy and practical.

---

## Maintenance & Add-Ons — process shots, not portraits

These eight are services, not styles. A portrait makes no sense; a detail shot
of the work does. **Leaving them as typographic cards is a perfectly good
option** — a grid does not need a picture of a wash.

If you do want images, drop the portrait preamble and use:

> Close detail photograph, salon interior, natural window light, shallow depth
> of field, photorealistic, anatomically correct hands, no text —

| File | Prompt |
|---|---|
| `styles/takedown-and-removal.jpg` | Stylist's hands carefully unpicking a box braid, loose hair visible |
| `styles/wash-and-blow-dry.jpg` | Natural 4C hair being washed at a salon basin, water and lather |
| `styles/deep-conditioning-treatment.jpg` | Conditioning cream being worked through sectioned natural hair |
| `styles/scalp-treatment.jpg` | Fingertips massaging oil into a parted scalp, close and calm |
| `styles/braid-refresh.jpg` | Hands redoing the front two rows of an existing braided style |
| `styles/hair-extensions-supplied.jpg` | Neat packs of braiding hair in copper and honey tones on a counter |
| `styles/beads-and-cuffs.jpg` | Beads and gold cuffs laid out in a shallow dish |
| `styles/curl-ends-and-dip.jpg` | Braid ends being dipped into hot water, steam rising |

---

## Before you accept an output

- [ ] Braid count is consistent root to tip
- [ ] Every braid visibly attaches to the scalp
- [ ] Parting lines connect to the braids growing from them
- [ ] The style shown is the style named — a braid is not a twist, a twist is not a loc
- [ ] Hands, where visible, are anatomically correct
- [ ] Portrait 4:5, at least 1200×1500
- [ ] Skin tone and hair texture are rendered respectfully and realistically

Save into `public/images/styles/` under the exact filename. `.jpg`, `.png`,
`.webp` and `.avif` all resolve. The gallery reads the directory at build time,
so the card switches from typographic to photographic on the next build.
