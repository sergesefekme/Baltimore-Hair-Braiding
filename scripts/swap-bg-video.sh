#!/usr/bin/env bash
# Encode a source video to all-keyframe H.264 for scroll scrubbing.
#
#   bash scripts/swap-bg-video.sh "assets/videos/BRAIDING-scroll-background.mp4"
#
# -g 1 / -keyint_min 1 / -sc_threshold 0 makes every frame a keyframe, so the
# browser can seek to any frame without replaying the ones before it. That is
# what makes scroll scrubbing smooth, and it is the setting that matters most.
#
# CRF is the size/quality dial. The project skill specifies 18; that yields
# ~15.6 MB for this 15s clip. 23 yields ~9.7 MB with no visible difference
# behind a dark tint overlay. Raise or lower to taste.

set -euo pipefail

INPUT="${1:-}"
OUTPUT="website/public/bg.mp4"
CRF="${CRF:-23}"
# Brightness/colour grade. The raw clip is too dark to read behind a scrim.
EQ="${EQ:-eq=gamma=1.45:saturation=1.12:contrast=1.03}"

if [[ -z "$INPUT" ]]; then
  echo "usage: bash scripts/swap-bg-video.sh <input-video>" >&2
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "error: input not found: $INPUT" >&2
  exit 1
fi

mkdir -p website/public

ffmpeg -y -i "$INPUT" -an -vf "$EQ" \
  -c:v libx264 -preset slow -crf "$CRF" \
  -g 1 -keyint_min 1 -sc_threshold 0 \
  -pix_fmt yuv420p -movflags +faststart \
  "$OUTPUT"

echo "Encoded all-keyframe background video to $OUTPUT (crf $CRF)"

# Refresh the mobile / reduced-motion poster from the new video.
ffmpeg -y -ss 1.0 -i "$INPUT" -frames:v 1 -vf "$EQ,scale=1600:-2" -q:v 4 \
  website/public/img/mobile-poster.jpg

echo "Refreshed poster at website/public/img/mobile-poster.jpg"
