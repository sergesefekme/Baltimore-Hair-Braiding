/* ---------------------------------------------------------
   Client reviews
   ---------------------------------------------------------
   Renders genuine reviews from public.reviews into #words. The section is
   built to be honest when it is empty, which is its normal state until the
   Google Business Profile exists and real clients have written something.

   THIS FILE MUST NEVER CONTAIN A REVIEW. The site shipped with five
   fabricated testimonials and they were removed on 2026-08-26. Reviews live
   in the database, where adding one is a deliberate act with a record and a
   `published` flag that defaults to false. If you find yourself typing a
   quotation into this file, stop.

   When there are no published reviews the markup already in index.html
   stands: four checkable commitments and an invitation to read the Google
   profile. That is a truthful empty state, so there is nothing to hide and
   no spinner to show.
   --------------------------------------------------------- */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** "2026-08-14" -> "August 2026". Month precision only: a review is not an
 *  appointment, and the exact day invites arithmetic about how recent it is. */
function monthOf(iso) {
  const m = /^(\d{4})-(\d{2})/.exec(String(iso || ""));
  if (!m) return "";
  return new Date(Date.UTC(+m[1], +m[2] - 1, 15)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function stars(rating) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "";
  // The glyphs are decorative; the accessible name carries the meaning.
  return (
    `<span class="stars" role="img" aria-label="Rated ${n} out of 5">` +
    "★".repeat(n) +
    "</span>"
  );
}

function card(r) {
  const where =
    r.source === "google"
      ? "Google review"
      : "Client review";
  const when = monthOf(r.review_date);

  return `
    <figure class="quote glass reveal quote--real">
      ${stars(r.rating)}
      <blockquote class="quote__body quote__body--real">${esc(r.body)}</blockquote>
      <figcaption class="quote__by">
        <span class="quote__name">${esc(r.author_name)}</span>
        <span class="quote__meta">${where}${when ? " &middot; " + esc(when) : ""}</span>
      </figcaption>
    </figure>`;
}

export async function setupReviews() {
  const grid = document.querySelector("#words .words__grid");
  if (!grid || !URL_BASE || !ANON_KEY) return;

  let rows = [];
  try {
    const res = await fetch(
      `${URL_BASE}/rest/v1/reviews` +
        `?select=author_name,rating,body,source,review_date` +
        `&published=eq.true&order=sort_order.asc,created_at.desc&limit=6`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    );
    if (!res.ok) return;
    rows = await res.json();
  } catch {
    // Offline, blocked, or the table is unreachable. The honest empty state is
    // already on the page; failing quietly leaves it there.
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) return;

  // Real reviews lead. The commitments stay underneath — they answer
  // different questions, and a client reading both gets more than either.
  grid.insertAdjacentHTML("afterbegin", rows.map(card).join(""));

  const head = document.querySelector("#words .words__head .section-head");
  if (head) head.textContent = "What clients say";

  const lede = document.querySelector("#words .words__head .lede");
  if (lede) {
    lede.textContent =
      rows.length === 1
        ? "One client's own words, and the commitments behind them."
        : "Clients in their own words, and the commitments behind them.";
  }
}
