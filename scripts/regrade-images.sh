#!/usr/bin/env bash
# Re-derive the site's WebP imagery from the reference PNGs, brightened.
#
#   bash scripts/regrade-images.sh
#
# Why
# ---
# The Higgsfield references render very dark — mean luma 19-29 out of 255.
# That reads as "moody" in isolation but on the page the braid work, which is
# the actual product, disappears into the background. The site was shipping
# images at luma 46-59; this lifts them to ~90-105, roughly matching the
# graded background video so the two layers sit in the same exposure world.
#
# GRADE is the dial. Measured on BRAND-hero-reference.png:
#
#   gamma 1.6                    -> luma  61   still too dark
#   gamma 1.9 + brightness 0.03  -> luma  91   <- default
#   gamma 2.2 + brightness 0.05  -> luma 114   background goes hazy
#   gamma 2.2 + shadow curve     -> luma 147   washed out
#
# Re-run after changing GRADE and check the printed luma column.

set -euo pipefail

SRC="assets/references"
OUT="website/public/img"

GRADE="${GRADE:-eq=gamma=1.9:saturation=1.12:brightness=0.03}"
QUALITY="${QUALITY:-82}"

# Output geometry matches what the site already ships: 1600x904.
W=1600
H=904

if [[ ! -d "$SRC" ]]; then
  echo "error: $SRC not found — run from the project root" >&2
  exit 1
fi

mkdir -p "$OUT"

luma() {
  ffprobe -v error -f lavfi -i "movie=$1,format=gray,signalstats" \
    -show_entries frame_tags=lavfi.signalstats.YAVG -of csv=p=0 2>/dev/null | head -1
}

printf "%-14s %10s %10s %10s\n" "image" "luma-was" "luma-now" "size"

for name in hero material workspace; do
  in="$SRC/BRAND-${name}-reference.png"
  out="$OUT/${name}.webp"

  [[ -f "$in" ]] || { echo "error: missing $in" >&2; exit 1; }

  # Measured before overwriting so the report is meaningful.
  was="-"
  [[ -f "$out" ]] && was="$(cd "$OUT" && luma "${name}.webp")"

  ffmpeg -y -v error -i "$in" \
    -vf "${GRADE},scale=${W}:${H}:flags=lanczos" \
    -c:v libwebp -quality "$QUALITY" -compression_level 6 \
    -update 1 "$out"

  now="$(cd "$OUT" && luma "${name}.webp")"
  printf "%-14s %10s %10s %10s\n" "$name" "${was%%.*}" "${now%%.*}" \
    "$(( $(stat -c%s "$out") / 1024 ))K"
done

echo
echo "Regraded 3 images -> $OUT"
