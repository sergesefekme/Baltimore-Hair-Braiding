# Hero image — generation prompts

Derived from `brand-kit.md` §11 (Visual Mood) and the hero's actual layout.

## Layout constraints the image must satisfy

These come from the built page, not from taste:

- **16:9 landscape.** The hero background is `object-fit: cover` on a fixed
  full-screen layer. Anything portrait gets cropped to its middle third.
- **Left ~40% must be calm and dark.** It carries the eyebrow, the 81px title,
  the slogan, a four-line paragraph and two buttons. Detail there fights the
  copy.
- **Subject sits right of centre**, around 55–65% across — matching the video
  composition currently in place (`X=520` on a 1280 canvas).
- **Nothing important within 8% of any edge.** `cover` crops differently
  between roughly 1200px and 1900px viewports.
- **No text, no logos, no signage.** All type is rendered in HTML.

---

## Prompt A — the hands (recommended)

The brand kit calls hands "the hero of this brand" and the slogan is *Crowned
by hand*. This is the one that argues the positioning rather than decorating it.

```
Extreme close-up, braider's hands mid-motion sectioning and feeding hair into a
knotless braid at the crown, fingers crossing three strands, a freshly drawn
part visible along the scalp. Deep-skinned hands, short neat nails, a thin gold
band catching the key light.

Composition: hands and hair occupy the right 55% of the frame; the left 40%
falls away into soft, unlit warm shadow with no detail — empty negative space.
16:9 landscape.

Lighting: warm low-key, 2800K throughout. Large soft key close and slightly
above, wrapping the hands with soft shadow edges. Soft warm-gold rim separating
hands from the background. A brass sconce burning out of focus in the deep
background. Key-to-fill about 3:1 — moody but never murky, shadow detail always
readable.

Skin: deep brown skin correctly exposed and neutral, soft healthy sheen, no
blown specular highlights, no orange or yellow cast. Warmth comes from the room
and the gold, not from a filter.

Environment: walnut and brass, oxblood velvet just visible, all heavily
defocused. Background falls to near-black #100B09 at the frame edges.

Camera: 85mm, f/2.0, shallow depth of field, one detail sharp and everything
else falling away. Subtle warm halation on highlights, fine grain, slight edge
softness.

Grade: lifted blacks with a red-brown bias — never pure crushed black. Golds
and ambers saturated, greens and blues pulled down hard. Fine grain 2–3%,
vignette no more than 12%.
```

## Prompt B — the finished style

Use if you want a person rather than a detail. Higher risk: faces are where
generators fail this brand hardest.

```
Three-quarter rear profile of a Black woman with freshly installed knotless box
braids falling past her shoulders, head turned slightly away, chin lifted. The
braid pattern, the crisp parting grid and the sheen along the length are the
subject — her face is partially turned from camera.

Composition: subject occupies the right 55–60% of the frame; the left 40% is
soft unlit warm shadow, empty, holding no detail. Nothing important within 8%
of any edge. 16:9 landscape.

Lighting: warm low-key 2800–3200K. Large soft key close and slightly above.
Warm-gold rim along the jaw and the outer braids to separate her from the dark
background. A softly lit mirror and a warm bulb defocused behind her. 3:1
key-to-fill — she must read as beautiful, never obscured.

Skin: deep brown skin exposed correctly and rendered neutral within the warm
room. Soft sheen, no blown highlights on the cheekbone or forehead, no orange
cast. Full shadow detail retained across the face — no crushed shadows on
features.

Environment: deep warm-dark atelier interior, walnut station, brass fixtures,
oxblood velvet seating, all defocused. Background falls to near-black #100B09
at the edges.

Camera: 85mm, f/1.8, shallow depth of field, portrait framing. Warm halation,
gentle grain, slight lens softness at the edges.

Grade: warm and deep, lifted red-brown blacks, saturated gold and amber, almost
no cool colour anywhere. Grain 2–3%, vignette under 12%.
```

## Prompt C — macro texture

Safest to generate; no faces or hands to get wrong. Weakest at selling the
service, so best as a secondary section image rather than the hero.

```
Macro detail of a single fresh cornrow row, individual strands catching a warm
key light, the geometry of the braid and the crispness of the part filling the
right two-thirds of frame. Left third falls to unlit warm shadow.

16:9 landscape. Warm 2800K low-key light, soft warm-gold rim along the strand
highlights, background defocused to near-black #100B09. 100mm macro, f/2.8,
razor-thin plane of focus. Lifted red-brown blacks, saturated amber, no cool
tones, fine grain, subtle vignette.
```

---

## Negative prompt

Paste into whichever field the tool provides. Every item is an explicit
anti-pattern from `brand-kit.md` §11.

```
text, watermark, logo, signage, lettering, caption
bright white background, grey background, clinical lighting, fluorescent tubes
cool tones, blue cast, teal shadows, neon
orange skin, yellow cast, oversaturated skin
blown-out highlights on skin, specular hotspot on face
crushed shadows on face, underexposed face, features lost in shadow
hair floating on plain background, beauty-supply catalogue look
cluttered product shelves, retail shelving, busy background
before-and-after grid, collage, split frame
extra fingers, malformed hands, distorted fingers
harsh hard-edged shadows, ring-light catchlight
```

---

## Checks before you accept a render

`brand-kit.md` is explicit that failing these is disqualifying regardless of how
good the image looks:

- [ ] Facial or hand shadow detail readable — nothing crushed to black
- [ ] Skin neutral, not orange; warmth from the room and gold only
- [ ] No blown specular hotspot on skin
- [ ] Left 40% genuinely empty and dark enough to carry the copy
- [ ] No text, logo or signage anywhere in frame
- [ ] Blacks lifted red-brown, not pure black
- [ ] Hands (if present) anatomically correct — count the fingers

## After you have the file

```bash
# Drop the render into assets/references/, then:
bash scripts/regrade-images.sh     # grades and converts to WebP at site brightness
```

If it replaces the hero background rather than sitting in a section, it needs to
become `website/public/bg.mp4` — a still can be given slow motion with
`scripts/hero-from-still.sh`, though genuine footage always looks better than a
synthesised push-in.
