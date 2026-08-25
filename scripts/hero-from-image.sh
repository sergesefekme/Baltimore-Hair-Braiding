#!/usr/bin/env bash
# Build the scroll-scrubbable hero background from a LANDSCAPE brand image.
#
#   bash scripts/hero-from-image.sh assets/generated/crowned-by-hand-hero.png
#
# Unlike hero-from-portrait.sh, this expects a source that is already 16:9 and
# already art-directed — no blurred fill, no reframing. It only adds the slow
# push-in the hero needs so it is not a frozen still, and lifts the subject.
#
# The source here is 2688px wide against a 1280px output, so even at full zoom
# the pipeline is downsampling. The result is genuinely sharp, unlike a hero
# synthesised from a phone-sized frame grab.

set -euo pipefail

INPUT="${1:-}"
OUTPUT="website/public/bg.mp4"
POSTER="website/public/img/mobile-poster.jpg"

# Output geometry. 1600x900 rather than 1280x720: the hero is a full-screen
# background, so on a 1920px display 1280 is a 1.50x upscale and visibly soft,
# where 1600 is 1.20x. Measured on this source, raising CRF to 30 pays for the
# extra pixels and then some — 1600x900 @ crf 30 is 9.1MB against 1280x720 @
# crf 26 at 10.1MB. Sharper AND smaller. Compared at 1:1 scaled to 1920, strand
# and skin detail is better at 1600/30 with no visible artefacts.
#
#   1280x720 crf 26 -> 10.1MB   1.50x upscale at 1920
#   1600x900 crf 28 -> 11.8MB   1.20x
#   1600x900 crf 30 ->  9.1MB   1.20x   <- default
#   1600x900 crf 32 ->  7.0MB   1.20x
OUT_W="${OUT_W:-1600}"
OUT_H="${OUT_H:-900}"
CRF="${CRF:-30}"
FPS=24
DUR="${DUR:-14}"
FRAMES=$(( FPS * DUR ))   # last frame index for the zoom ramp

if [[ -z "$INPUT" ]]; then
  echo "usage: bash scripts/hero-from-image.sh <landscape-image>" >&2
  exit 1
fi
if [[ ! -f "$INPUT" ]]; then
  echo "error: input not found: $INPUT" >&2
  exit 1
fi

# Force an exact 16:9 canvas. zoompan samples iw/zoom x ih/zoom, preserving the
# input aspect — feed it anything else and the output is stretched.
SRC_W=$(ffprobe -v error -select_streams v -show_entries stream=width  -of csv=p=0 "$INPUT")
CROP_H=$(( SRC_W * 9 / 16 ))
CROP_H=$(( CROP_H - CROP_H % 2 ))
CROP="crop=${SRC_W}:${CROP_H}"

# --- Grade -------------------------------------------------------------------
# Measured on crowned-by-hand-hero.png: the copy zone (left 40%) sits at luma 16
# and the lit hands at 46, against site imagery at 91-102. The hands need to
# come up or they read as dim next to the rest of the page.
#
# Curves rather than gamma, deliberately. gamma lifts everything uniformly and
# wrecks the copy zone; a curve lifts mid-tones hard and leaves the toe alone,
# so the hands brighten while the left stays dark enough to seat the headline.
#
#   ungraded          left 16   hands  46
#   gamma 1.35        left 40   hands  74   <- copy zone ruined
#   earlier curve     left 24   hands  70   <- subject still dim vs the site
#   this curve        left 34   hands  90   <- matches site imagery at 91-102
#   pushed further    left 39   hands  99   <- blacks lift, background goes muddy
#
# 90 is the target because the site's other imagery sits at 91-102; below that
# the hero reads as the dim thing on an otherwise bright page.
GRADE="${GRADE:-curves=all='0/0.015 0.13/0.32 0.36/0.70 0.72/0.93 1/1',eq=saturation=1.10:contrast=1.02}"

# --- Motion ------------------------------------------------------------------
# Slow push-in drifting right, toward the hands. 10% over 14s — enough that the
# hero is alive on arrival, slow enough that scrubbing it never feels frantic.
ZOOM="zoompan=z='1+0.10*on/${FRAMES}':x='(iw-iw/zoom)*(0.50+0.12*on/${FRAMES})':y='(ih-ih/zoom)*0.5':d=1:s=${OUT_W}x${OUT_H}:fps=${FPS}"

mkdir -p website/public/img

ffmpeg -y -v error -loop 1 -framerate "$FPS" -t "$DUR" -i "$INPUT" \
  -vf "${CROP},${GRADE},${ZOOM}" \
  -an -c:v libx264 -preset slow -crf "$CRF" \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p -movflags +faststart \
  "$OUTPUT"

echo "Built all-keyframe hero -> $OUTPUT (crf $CRF, ${DUR}s)"

ffmpeg -y -v error -ss 1.0 -i "$OUTPUT" -frames:v 1 -update 1 \
  -vf "scale=1600:-2" -q:v 4 "$POSTER"

echo "Refreshed poster -> $POSTER"
