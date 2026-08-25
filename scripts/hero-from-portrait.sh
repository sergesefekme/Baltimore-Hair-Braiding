#!/usr/bin/env bash
# Build the scroll-scrubbable 16:9 background from a PORTRAIT source video.
#
#   bash scripts/hero-from-portrait.sh assets/videos/pinterest-braids-source.mp4
#
# Why not just let CSS crop it
# ----------------------------
# .bg-video uses object-fit:cover. Feeding it a 720x1080 portrait means a
# 1440x900 viewport shows roughly the middle 44% of the frame — which on
# footage of a person cuts the head off. So the 16:9 canvas is composed here
# instead: the full portrait is kept sharp and placed right of centre, and a
# blurred, darkened blow-up of the same frame fills the rest.
#
# The subject sits right so the left half stays quiet for the hero copy, which
# is left-aligned throughout the site. That side is blurred and dark, which is
# doing the same job .bg-tint::after used to do on its own.

set -euo pipefail

INPUT="${1:-}"
OUTPUT="website/public/bg.mp4"
POSTER="website/public/img/mobile-poster.jpg"

CRF="${CRF:-26}"

# Horizontal position of the sharp panel on the 1280px canvas. The panel is
# 480px wide (720x1080 scaled to 720 tall), so 400 is dead centre and 660 sits
# it hard right. 520 is the middle ground: off the reading column enough that
# the left-aligned copy is not fighting her, without pushing her to the edge.
X="${X:-520}"

if [[ -z "$INPUT" ]]; then
  echo "usage: bash scripts/hero-from-portrait.sh <portrait-video>" >&2
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "error: input not found: $INPUT" >&2
  exit 1
fi

# Blur is heavy so the split reads as depth of field rather than a seam.
# Brightness was -0.18 and saturation 0.78, which left the sides reading as
# a dark smear. Lifted to -0.04 / 0.92 so the fill keeps some of the room's
# warm light instead of going to mud.
FILL="scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,gblur=sigma=42,eq=brightness=-0.04:saturation=0.92"

# Source measures luma ~142, brighter than the site's images at 91-102.
# Pulled down slightly so the hero does not blow out against the rest.
GRADE="${GRADE:-eq=gamma=0.94:saturation=1.10:contrast=1.05,vignette=a=PI/4.5}"

mkdir -p website/public/img

# The sharp panel's vertical edges are feathered over 90px via a per-pixel
# alpha ramp. Butted straight against the blur it reads as a hard seam —
# obviously two layers. Faded, it reads as depth of field.
# geq is slow (per-pixel, per-frame); this is the reason the encode takes
# ~30s rather than ~5s. Worth it.
FEATHER="format=yuva420p,geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='clip(min(X,W-X)/90*255,0,255)'"

ffmpeg -y -v error -i "$INPUT" \
  -filter_complex "[0:v]${FILL}[bg];[0:v]scale=-2:720:flags=lanczos,${FEATHER}[fg];[bg][fg]overlay=x=${X}:y=0:format=auto[v];[v]${GRADE}[out]" \
  -map "[out]" -an \
  -c:v libx264 -preset slow -crf "$CRF" \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p -movflags +faststart \
  "$OUTPUT"

echo "Built 16:9 all-keyframe hero -> $OUTPUT (crf $CRF)"

ffmpeg -y -v error -ss 1.0 -i "$OUTPUT" -frames:v 1 -update 1 \
  -vf "scale=1600:-2" -q:v 4 "$POSTER"

echo "Refreshed poster -> $POSTER"
