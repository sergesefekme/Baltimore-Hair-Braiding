#!/usr/bin/env python3
"""Derive every brand asset the site uses from one master logo file.

    python scripts/build-brand-assets.py

Source of truth: assets/brand/logo-master.png. Nothing downstream is
hand-edited. Re-run this after replacing the master and every size regenerates
together, which is the only way the nav, the footer, the emails and the favicon
stay in agreement. Cropping them one at a time by hand is how a logo ends up
subtly different in six places.

WHY THREE SHAPES AND NOT ONE

The master is a circular badge: a braided profile, a gold MB monogram, the
script name, and two lines of small-caps tagline. It is beautiful at size and
illegible when small -- below roughly 140px the tagline collapses into a grey
smear. So it is used at three scales, each cut to what actually survives:

  logo-full-*   the whole badge. Footer and email, 140px and up.

  mark-*        the braided profile, cut as a circular cameo. The nav, ~38px,
                where the profile still reads clearly but the tagline cannot.
                The disc is not decoration: the artwork is black and gold on
                white, so against this site's near-black header it would
                otherwise have no ground to sit on.

  favicon-*     the gold MB monogram on a DARK disc with a gilt ring. At 16px
                the profile is a dark blob and the script is gone, but two
                bold letters still read. The disc is dark and the ring gilt
                because a favicon has to survive a white tab bar and a dark
                one: gold on white is too faint, and an unringed dark disc
                dissolves into a dark tab. Gold on near-black, edged in gold,
                holds on both. This was measured, not assumed.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "assets" / "brand" / "logo-master.png"
OUT = ROOT / "website" / "public" / "img" / "brand"
PUBLIC = ROOT / "website" / "public"

GILT = (210, 162, 76)      # --gilt, the gold already used across the site
NOIR = (16, 11, 9)         # --noir, the page background
WHITE = (255, 255, 255)

# Regions of the master, in its own pixel coordinates.
#
# The profile is given as a CIRCLE (centre + radius), not a box, and the disc
# is cut straight out of it. That is deliberate. A rectangular crop pasted
# inside a larger disc leaves the braids ending on a hard vertical line partway
# across the white — it reads as a mistake. Cutting a circle instead means
# every pixel inside the disc is real artwork and the braids run off the rim
# as framing.
#
# The head cannot be shown whole. Measured on the master, the braids reach
# x~500 and the serif of the M begins at x~505, so there is no clean vertical
# gap between them; any crop wide enough for the full braid fall drags in the
# M. Hence a cameo: face, ear, hoop and braid, closed by the rim.
#
# The radius is bounded on three sides -- centre_x + radius must stay under
# ~498 to clear the M, and the circle must stay inside the master's gilt ring.
# Changing these without re-checking that arithmetic pulls debris into the mark.
PROFILE_CIRCLE = (315, 455, 180)   # centre x, centre y, radius
MONOGRAM = (515, 310, 1045, 700)


def master() -> Image.Image:
    if not MASTER.exists():
        raise SystemExit(f"missing master logo: {MASTER}")
    return Image.open(MASTER).convert("RGBA")


def full_badge() -> Image.Image:
    """The whole badge, cropped square to its outer ring."""
    im = master().crop((20, 15, 1235, 1235))
    side = max(im.size)
    sq = Image.new("RGBA", (side, side), WHITE + (255,))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return sq


def as_gilt(art: Image.Image) -> Image.Image:
    """Flatten the monogram's gold gradient to a brighter, even gilt.

    The master's gold runs from near-brown to near-white across each stroke,
    which is handsome at 500px and turns to mud at 16. Mapping it onto one
    bright tone keeps the letterforms readable when they are four pixels wide."""
    a = np.asarray(art).astype(float)
    lum = a[:, :, :3].mean(axis=2)
    alpha = a[:, :, 3]
    out = np.zeros_like(a)
    t = np.clip((lum - 40) / 170, 0.35, 1.0)
    for i, c in enumerate((232, 190, 104)):
        out[:, :, i] = c * t
    out[:, :, 3] = np.where((alpha > 10) & (lum < 250), alpha, 0)
    return Image.fromarray(out.astype("uint8"))


def cameo(size, circle=None):
    """The braided profile, cut as a circle straight from the master.

    No disc is drawn under it: the master's own white ground becomes the disc,
    so there is no seam between artwork and background and nothing inside the
    rim that is not real artwork. Supersampled 6x, because the gilt rim is a
    single pixel at nav size and aliases into a dashed line if drawn directly."""
    cx, cy, R = circle or PROFILE_CIRCLE
    ss = 6
    S = size * ss
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    inset = max(1, round(S * 0.015))
    circ = (inset, inset, S - inset, S - inset)

    art = master().crop((cx - R, cy - R, cx + R, cy + R)).resize((S, S), Image.LANCZOS)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).ellipse(circ, fill=255)
    canvas.paste(art, (0, 0), mask)
    ImageDraw.Draw(canvas).ellipse(
        circ, outline=GILT + (255,), width=max(2, round(S * 0.030))
    )
    return canvas.resize((size, size), Image.LANCZOS)


def disc(size, box, disc_col, *, fill, ring=True, recolor=False, square=False):
    """Artwork on a disc, rendered at `size` px square.

    Supersampled 4x then reduced: a one-pixel ring drawn directly at 32px
    aliases into a dashed line."""
    ss = 4
    S = size * ss
    canvas = Image.new("RGBA", (S, S), disc_col + (255,) if square else (0, 0, 0, 0))
    inset = max(1, round(S * 0.015))
    circ = (inset, inset, S - inset, S - inset)

    plate = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    if square:
        plate.paste(Image.new("RGBA", (S, S), disc_col + (255,)))
    else:
        ImageDraw.Draw(plate).ellipse(circ, fill=disc_col + (255,))

    art = master().crop(box)
    if recolor:
        art = as_gilt(art)
    span = S - 2 * inset
    sc = min(span * fill / art.width, span * fill / art.height)
    art = art.resize((round(art.width * sc), round(art.height * sc)), Image.LANCZOS)
    plate.alpha_composite(art, ((S - art.width) // 2, (S - art.height) // 2))

    if square:
        canvas.alpha_composite(plate)
    else:
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).ellipse(circ, fill=255)
        canvas.paste(plate, (0, 0), mask)
        if ring:
            ImageDraw.Draw(canvas).ellipse(
                circ, outline=GILT + (255,), width=max(2, round(S * 0.030))
            )

    return canvas.resize((size, size), Image.LANCZOS)


def mark(size):
    """Nav mark: the braided profile, cut as a circular cameo."""
    return cameo(size)


def icon(size, square=False):
    """Favicon: the gilt monogram on a dark disc."""
    return disc(size, MONOGRAM, NOIR, fill=0.72, recolor=True, square=square)


def save(im, path, **kw):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, **kw)
    print(f"  {path.relative_to(ROOT).as_posix():<44} {im.size[0]:>4}px {path.stat().st_size:>8,}B")


def main():
    full = full_badge()

    print("full badge - footer and email:")
    for w in (360, 720):
        save(full.resize((w, w), Image.LANCZOS).convert("RGB"),
             OUT / f"logo-full-{w}.webp", format="WEBP", quality=88, method=6)
    # Not WebP: Outlook on Windows still will not render it, and a broken image
    # in a booking confirmation is worse than a few extra kilobytes.
    #
    # logo-email is the one emails point at, rendered at 240px. It is built at
    # 520 so that 240 is a true 2x -- phones are where most of this mail is
    # read, and a 340px file at 240px is 1.4x and visibly soft.
    #
    # logo-full-340 is KEPT FOREVER even though nothing new references it.
    # Email that has already gone out links to that exact URL, and deleting it
    # would blank the logo in mail already sitting in people's inboxes.
    # Quantised to a 256-colour palette: 145KB instead of 283KB, with no
    # banding visible in the gold gradient even at 2x zoom (checked, not
    # assumed). PNG-8 is as universally supported as PNG-24, Outlook included,
    # and this file is fetched over mobile data by most of its readers.
    save(full.resize((520, 520), Image.LANCZOS).convert("RGB")
             .convert("P", palette=Image.ADAPTIVE, colors=256),
         OUT / "logo-email.png", format="PNG", optimize=True)
    save(full.resize((340, 340), Image.LANCZOS).convert("RGB"),
         OUT / "logo-full-340.png", format="PNG", optimize=True)

    # 96/192 rather than 76/152: the nav mark is now 56px and the service-page
    # masthead 60px, so 2x needs 120 derivative pixels and a 3x phone at 60px
    # wants 180. 152 fell short of that and would have resampled up.
    print("nav mark - circular cameo:")
    for s in (96, 192):
        save(mark(s), OUT / f"mark-{s}.webp", format="WEBP", quality=92, method=6)

    print("favicons - monogram on dark disc:")
    # Each rendered at its true size rather than downscaled from one big one,
    # so the 16px version gets its own supersampled pass.
    for s in (16, 32, 48, 192, 512):
        save(icon(s), OUT / f"favicon-{s}.png", format="PNG", optimize=True)
    save(icon(48), PUBLIC / "favicon.ico", format="ICO",
         sizes=[(16, 16), (32, 32), (48, 48)])
    # iOS composites any transparency onto black and adds its own rounding, so
    # this one is a full-bleed opaque square.
    save(icon(180, square=True), PUBLIC / "apple-touch-icon.png",
         format="PNG", optimize=True)


if __name__ == "__main__":
    main()
