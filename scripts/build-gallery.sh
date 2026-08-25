#!/usr/bin/env bash
# Curate and web-optimise the style gallery.
#
#   bash scripts/build-gallery.sh
#
# Reads assets/references/braid-styles/<category>/ and writes web-ready WebP
# into website/public/img/styles/<category>/.
#
# This is a CURATED build, not a bulk convert. The reference folder holds
# 26 files totalling 138MB; a large share carry TikTok/Instagram UI overlays,
# competitor salon watermarks, or baked-in marketing text, and cannot go on a
# commercial page. SELECT below lists only what passed inspection — edit it to
# change what ships. Everything not listed is deliberately excluded; see the
# EXCLUDED notes for why.

set -u

SRC="assets/references/braid-styles"
OUT="website/public/img/styles"

# Long edge in px. Gallery tiles render at ~420px wide on desktop; 900 covers
# 2x displays with headroom and keeps the whole gallery under ~1.5MB.
MAXW="${MAXW:-900}"
QUALITY="${QUALITY:-80}"

# Unifying grade. These come from a dozen different phones and rooms — daylight,
# ring light, salon fluorescent — and dropped side by side they read as a
# scraped mood board rather than one salon's work. A light warm push and a
# small desaturation pulls them toward the site's palette without looking
# filtered. brand-kit.md calls for exactly this to "unify mismatched
# photography".
GRADE="${GRADE:-eq=saturation=0.90:contrast=1.06:brightness=0.01,colorbalance=rm=0.05:gm=0.01:bm=-0.06}"

# --- Selection ---------------------------------------------------------------
# category:file-prefix pairs, in display order.
SELECT="
protective:01
protective:02
protective:03
coily:02
coily:04
curly:02
curly:03
curly:05
curly:06
wavy:01
wavy:02b
wavy:03
wavy:07
straight:01
"

# EXCLUDED and why — kept here so the reasoning is not lost:
#   coily/01      "Style and smile hairmpire" text burned in
#   coily/03      "BEAUTY BUFFET SALON" logo burned in, letterboxed
#   curly/01      gold "B_B" logo top-left, weak composition
#   curly/04      TikTok comment-reply UI overlaid across the frame
#   curly/07      multi-panel collage, not a single image
#   curly/08      child client, different context from the rest
#   curly/09      "bohobraid.com" watermark
#   wavy/04       TikTok handle watermark + "New Braids" sticker
#   wavy/05       TikTok handle watermark
#   wavy/06       full Instagram UI — caption, like count, follow button
#   straight/02   near-duplicate of straight/01, same shot
#   straight/03   "CORNROW HAIRSTYLES FORB 12 YEAR OLDS" text burned in
#
# wavy/02 is an ANIMATED WebP (a 119s clip, 92MB). ffmpeg's webp demuxer
# cannot decode animated WebP at all — it reports "image data not found" —
# so a still was extracted from the source video and saved alongside it as
# 02b-...-still.jpg. That is what the gallery uses.
#
# Note the -nostdin on the ffmpeg call below: without it ffmpeg consumes the
# loop's stdin and silently eats characters from the SELECT list. The symptom
# was "straight" arriving as "traight" and the entry being reported missing.

rm -rf "$OUT"
mkdir -p "$OUT"

n=0; missing=0
printf "%-12s %-6s %9s  %-11s\n" "category" "file" "size" "dimensions"

while IFS=: read -r cat idx; do
  [ -z "${cat:-}" ] && continue
  mkdir -p "$OUT/$cat"

  src=$(ls "$SRC/$cat/$idx-"* 2>/dev/null | head -1)
  if [ -z "$src" ]; then
    printf "  %-10s %-6s MISSING\n" "$cat" "$idx"; missing=$((missing+1)); continue
  fi

  dest="$OUT/$cat/$idx.webp"
  ffmpeg -nostdin -y -v error -i "$src" -frames:v 1 \
    -vf "${GRADE},scale='min(${MAXW},iw)':-2:flags=lanczos" \
    -c:v libwebp -quality "$QUALITY" -compression_level 6 \
    -update 1 "$dest" 2>/dev/null

  if [ -s "$dest" ]; then
    n=$((n+1))
    printf "  %-10s %-6s %8sK  %-11s\n" "$cat" "$idx" \
      "$(( $(stat -c%s "$dest")/1024 ))" \
      "$(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$dest")"
  else
    printf "  %-10s %-6s ENCODE FAILED\n" "$cat" "$idx"; missing=$((missing+1))
  fi
done <<< "$SELECT"

echo
echo "$n images -> $OUT   ($(du -sh "$OUT" | cut -f1) total)"
[ "$missing" -gt 0 ] && echo "WARNING: $missing entries failed" && exit 1
exit 0
