/* Emails the salon — and now the customer — when a booking request lands.
 *
 * Deployed to project mirabelle-b-booking (dqglhppksyhekaflnyop), invoked by
 * the after-insert trigger on public.booking_requests (see
 * supabase/notify_trigger.sql). The trigger posts Supabase's standard webhook
 * envelope { type, table, record, old_record }; only `record` is used.
 *
 * SENDER: bookings@mimi-african-braiding-styling.com — the salon's own
 * domain, verified at Resend (Route 53, us-east-1).
 *
 * Resend matches the `from` address against a verified domain EXACTLY. A
 * verified subdomain does not authorise its parent, and vice versa. If the
 * verified domain changes, this address must change with it or every send
 * returns 403 "domain is not verified".
 *
 * Do not "fix" a 403 by switching to onboarding@resend.dev: the shared sender
 * only delivers to the account owner (ssefekme@itworldteks.com) and will
 * refuse NOTIFY_TO below. Tested 2026-08-25.
 *
 * RESEND_API_KEY must be set as an Edge Function secret.
 *   Dashboard -> Project Settings -> Edge Functions -> Secrets
 *
 * PHASE 2 (2026-08-26): the customer now gets a confirmation too, when they
 * left an address — the email field is optional and most bookings arrive
 * without one, so this is best-effort by design. The two sends are
 * independent: the salon notification is what the business cannot afford to
 * lose, so a failure to reach the customer must never suppress it. See
 * SEND ORDER below.
 */

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
// Falls back to the salon's own address so a forgotten secret degrades to
// "mail still arrives" rather than "bookings vanish".
const NOTIFY_TO =
  Deno.env.get("BOOKING_NOTIFY_TO") ?? "kamgamirabelle4@gmail.com";

// When the salon registers its own domain, verify it at Resend and set
// BOOKING_NOTIFY_FROM. Nothing else changes.
const FROM =
  Deno.env.get("BOOKING_NOTIFY_FROM") ??
  "Mirabelle.B Bookings <bookings@mimi-african-braiding-styling.com>";

const SALON_PHONE = "571-426-0602";
const SALON_ADDRESS = "44048 Lords Valley Ter, Ashburn, VA 20147";
const SITE = "https://mimi-african-braiding-styling.com";

/* Brand palette, from src/style.css :root. Email clients have no CSS
 * variables and poor <style> support, so every colour is inlined literally.
 * These are the real brand colours — noir and gilt. There is no purple in
 * this brand; do not introduce one here. */
const NOIR = "#100b09";
const ESPRESSO = "#1a1310";
const GILT = "#d2a24c";
const GILT_DEEP = "#a87c33";
const IVORY = "#f6efe7";
const SAND = "#d6c4b2";
const TAUPE = "#9a8778";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** "2026-09-10" -> "Thursday, September 10". Parsed as UTC noon so the date
 *  cannot slip a day either side of the boundary. Falls back to the raw
 *  string rather than printing "Invalid Date" at a customer. */
function prettyDate(iso: unknown): string {
  const raw = String(iso ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return raw;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** First name only, for the greeting. "Sarah Johnson" -> "Sarah". */
function firstName(full: unknown): string {
  const s = String(full ?? "").trim();
  if (!s) return "there";
  return s.split(/\s+/)[0];
}

async function send(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, ...payload }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return res;
}

/* ------------------------------------------------------------------ */
/* Email 1 — the salon                                                 */
/* ------------------------------------------------------------------ */

function salonEmail(r: Record<string, unknown>) {
  const tel = String(r.phone ?? "").replace(/[^\d+]/g, "");

  /* Phone and email are tap targets, not text. This lands on a phone between
     clients, and retyping a number off a screen is how numbers get misdialled. */
  const phoneCell = tel
    ? `<a href="tel:${esc(tel)}" style="color:${GILT_DEEP};font-weight:700;text-decoration:none">${esc(r.phone)}</a>`
    : esc(r.phone);
  const emailCell = r.email
    ? `<a href="mailto:${esc(r.email)}" style="color:${GILT_DEEP};font-weight:700;text-decoration:none">${esc(r.email)}</a>`
    : "&mdash;";

  const rows = [
    ["Customer", `<strong>${esc(r.name)}</strong>`],
    ["Phone", phoneCell],
    ["Email", emailCell],
    ["Service", `<strong>${esc(r.style)}</strong>`],
    // Date and time as separate rows: combined, the time hides inside the
    // date and gets skimmed past.
    ["Date", `<strong>${esc(prettyDate(r.preferred_date))}</strong>`],
    ["Time", esc(r.preferred_time || "Any time")],
    ["Notes", esc(r.notes || "—")],
    // Attribution. Reads "—" for a visitor who arrived with no campaign on
    // the URL, which is most organic traffic.
    ["Lead source", esc(r.source || "—")],
    ["Campaign", esc(r.utm_campaign || "—")],
  ]
    .map(
      ([k, v]) =>
        `<tr>` +
        `<td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:13px;white-space:nowrap;vertical-align:top">${k}</td>` +
        `<td style="padding:7px 0;color:${NOIR};font-size:15px">${v}</td>` +
        `</tr>`
    )
    .join("");

  return {
    to: [NOTIFY_TO],
    // Replying goes straight to the client when they left an address.
    reply_to: (r.email as string) || undefined,
    subject: `New booking: ${r.name} — ${r.style} on ${r.preferred_date}`,
    text:
      `New booking request\n\n` +
      `Customer: ${r.name}\n` +
      `Phone: ${r.phone}\n` +
      `Email: ${r.email || "—"}\n` +
      `Service: ${r.style}\n` +
      `Date: ${prettyDate(r.preferred_date)}\n` +
      `Time: ${r.preferred_time || "Any time"}\n` +
      `Notes: ${r.notes || "—"}\n` +
      `Lead source: ${r.source || "—"}\n` +
      `Campaign: ${r.utm_campaign || "—"}\n\n` +
      `Review and confirm: ${SITE}/admin.html\n`,
    html: `
<div style="margin:0;padding:20px 12px;background:#f6efe7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0d3c6;border-radius:4px;overflow:hidden">

    <div style="padding:18px 24px;background:${NOIR}">
      <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${GILT}">New booking request</p>
      <p style="margin:5px 0 0;font-family:Georgia,serif;font-size:19px;font-weight:700;color:#f6efe7">
        ${esc(r.name)} &middot; ${esc(r.style)}
      </p>
    </div>

    <div style="padding:20px 24px 24px">
      <table style="border-collapse:collapse;width:100%">${rows}</table>

      <!-- The call to action. Without it this is a notification the salon
           reads and then has to go and find the dashboard for. -->
      <table style="border-collapse:collapse;margin:22px 0 0"><tr><td>
        <a href="${SITE}/admin.html"
           style="display:inline-block;padding:14px 26px;background:${GILT};color:${NOIR};font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border-radius:3px">
          Review &amp; confirm this appointment
        </a>
      </td></tr></table>

      <p style="margin:14px 0 0;font-size:13px;color:${TAUPE}">
        Confirming there emails the client automatically.
      </p>

      <p style="margin:16px 0 0;padding-top:14px;border-top:1px solid #e0d3c6;font-size:12px;color:${TAUPE}">
        Received ${esc(r.created_at)}
      </p>
    </div>
  </div>
</div>`,
  };
}

/* ------------------------------------------------------------------ */
/* Email 2 — the customer                                              */
/* ------------------------------------------------------------------ */

function customerEmail(r: Record<string, unknown>) {
  const name = esc(firstName(r.name));
  const service = esc(r.style);
  const date = esc(prettyDate(r.preferred_date));
  const time = esc(r.preferred_time || "Any time");

  const line = (label: string, value: string) =>
    `<tr>` +
    `<td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px;white-space:nowrap">${label}</td>` +
    `<td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${value}</td>` +
    `</tr>`;

  return {
    to: [String(r.email)],
    subject: "We received your Mirabelle.B appointment request",
    // Plain-text alternative matters: it is what shows in notification
    // previews, and it is the version that survives a client with images and
    // styles disabled.
    text:
      `Hello ${firstName(r.name)},\n\n` +
      `Thank you for choosing Mirabelle.B African Hair Braiding.\n\n` +
      `We received your request for:\n\n` +
      `Service: ${r.style}\n` +
      `Preferred Date: ${prettyDate(r.preferred_date)}\n` +
      `Preferred Time: ${r.preferred_time || "Any time"}\n\n` +
      `Your appointment is currently pending confirmation.\n\n` +
      `We will contact you shortly to confirm availability.\n\n` +
      `Questions, or need to change something? Call or text ${SALON_PHONE}.\n\n` +
      `Mirabelle.B African Hair Braiding\n` +
      `${SALON_ADDRESS}\n${SITE}\n`,
    html: `
<div style="margin:0;padding:24px 12px;background:${NOIR};font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:${ESPRESSO};border:1px solid #3b241d;border-radius:4px;overflow:hidden">

    <div style="padding:28px 28px 0">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${IVORY};letter-spacing:.02em">
        Mirabelle<span style="color:${GILT}">.</span>B
      </p>
      <p style="margin:4px 0 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${GILT}">
        African Hair Braiding &middot; Ashburn, VA
      </p>
    </div>

    <div style="padding:24px 28px 28px">
      <p style="margin:0 0 16px;font-size:17px;line-height:1.5;color:${IVORY}">
        Hello ${name},
      </p>

      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        Thank you for choosing Mirabelle.B African Hair Braiding.
      </p>

      <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${SAND}">
        We received your request for:
      </p>

      <table style="width:100%;border-collapse:collapse;background:${NOIR};border-left:2px solid ${GILT};padding:0">
        <tr><td style="padding:14px 18px">
          <table style="border-collapse:collapse">
            ${line("Service", service)}
            ${line("Preferred Date", date)}
            ${line("Preferred Time", time)}
          </table>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:${SAND}">
        Your appointment is currently
        <strong style="color:${GILT}">pending confirmation</strong>.
      </p>

      <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:${SAND}">
        We will contact you shortly to confirm availability.
      </p>

      <!-- Beyond the requested copy, kept deliberately: a confirmation with no
           way to reach the salon sends the client back to the site to hunt for
           the number. One line, and it is the line people actually use. -->
      <p style="margin:14px 0 0;font-size:15px;line-height:1.65;color:${SAND}">
        Questions, or need to change something? Call or text
        <a href="tel:+15714260602" style="color:${GILT};font-weight:600;text-decoration:none">${SALON_PHONE}</a>.
      </p>

      <div style="margin:26px 0 0;padding:18px 0 0;border-top:1px solid #3b241d">
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">Mirabelle.B African Hair Braiding</p>
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">${SALON_ADDRESS}</p>
        <p style="margin:0;font-size:13px">
          <a href="${SITE}" style="color:${GILT};text-decoration:none">mimi-african-braiding-styling.com</a>
        </p>
      </div>
    </div>
  </div>
</div>`,
  };
}

/* ------------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!RESEND_KEY) {
    // Loud, because a silent no-op here means bookings quietly go unseen.
    console.error("notify-booking: RESEND_API_KEY is not set");
    return new Response("Not configured", { status: 500 });
  }

  const { record } = await req.json();
  if (!record) return new Response("No record", { status: 400 });

  /* SEND ORDER: the salon first, and its failure is the only one that returns
   * non-2xx. A booking the salon never hears about is lost business; a
   * confirmation the customer never receives is a poorer experience but the
   * appointment still exists and still gets called. Those are not the same
   * severity, so they do not share a failure path. */
  try {
    await send(salonEmail(record));
  } catch (err) {
    console.error("notify-booking: salon email failed", err);
    return new Response(String(err), { status: 502 });
  }

  // Best-effort. The email field is optional, so most bookings skip this.
  if (record.email) {
    try {
      await send(customerEmail(record));
    } catch (err) {
      console.error("notify-booking: customer email failed", err);
      return new Response("ok (customer email failed)");
    }
  }

  return new Response("ok");
});
