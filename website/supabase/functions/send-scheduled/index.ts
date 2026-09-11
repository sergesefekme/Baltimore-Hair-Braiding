/* Reminder and review-request emails.
 *
 * Called per due appointment by the pg_cron jobs in phase5_scheduled_jobs.
 * The SQL side decides WHO is due and stamps the sent-at column in the same
 * transaction as the call; this function renders, re-checks, sends and logs.
 *
 * Cancelled appointments never reach here: send_appointment_reminders()
 * selects on status = 'confirmed'.
 *
 * THE REVIEW EMAIL DOES NOT GATE. It asks everyone for an honest review. The
 * earlier wording ("If you enjoyed your visit..." plus "if anything was not
 * right, tell us first") routed happy clients to Google and unhappy ones to a
 * phone call, which is review gating: prohibited by Google's review policy and
 * squarely at the FTC rule on consumer reviews, 16 CFR 465. Do not
 * reintroduce a condition on the ask.
 *
 * WHY THIS FUNCTION RE-CHECKS WHAT SQL ALREADY CHECKED
 * send_review_requests() selects and stamps in one statement, then fires an
 * async net.http_post. Between that stamp and this function running, the
 * booking can be cancelled, the appointment reopened, or the address changed.
 * The stamp is a CLAIM, not a verdict. Every condition is therefore verified
 * again here, against the live row, immediately before the mail goes out.
 *
 * Body: { kind: "reminder" | "review", record: {...}, review_url?: string }
 */

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const FROM =
  Deno.env.get("BOOKING_NOTIFY_FROM") ??
  "Mirabelle.B Bookings <bookings@mimi-african-braiding-styling.com>";

/* Supplied to every Edge Function by the platform. service_role bypasses RLS,
   which is required: email_log has RLS on and no policies, so nothing else can
   write to it. */
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const REVIEW_WAIT_HOURS = 48;
const EMAIL_TYPE = "google_review_request";

const SALON_PHONE = "571-426-0602";
const SALON_ADDRESS = "44048 Lords Valley Ter, Ashburn, VA 20147";
const SITE = "https://mimi-african-braiding-styling.com";
const MAPS =
  "https://www.google.com/maps/search/?api=1&query=44048+Lords+Valley+Ter%2C+Ashburn%2C+VA+20147";
// Deep-links the cancellation section, so the client lands on the rule rather
// than the top of a long policy page.
const CANCEL_POLICY = `${SITE}/policies.html#cancellation`;

const NOIR = "#100b09";
const ESPRESSO = "#1a1310";
const GILT = "#d2a24c";
const IVORY = "#f6efe7";
const SAND = "#d6c4b2";
const TAUPE = "#9a8778";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function prettyDate(iso: unknown): string {
  const raw = String(iso ?? "");
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
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

function prettyTime(t: unknown): string {
  const m = /^(\d{2}):(\d{2})/.exec(String(t ?? ""));
  if (!m) return "";
  let h = +m[1];
  const s = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${s}`;
}

function firstName(full: unknown): string {
  const s = String(full ?? "").trim();
  return s ? s.split(/\s+/)[0] : "there";
}

/* Deliberately permissive. This is a last-line sanity check against an empty
   or obviously malformed value, not an attempt to validate deliverability -
   Resend does that, and over-strict local regexes reject real addresses. */
function looksLikeEmail(v: unknown): boolean {
  const s = String(v ?? "").trim();
  return s.length > 3 && s.length < 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/* ---------------- database, as service_role ---------------- */

function db(path: string, init: RequestInit = {}) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_SERVICE_KEY ?? "",
      Authorization: `Bearer ${SB_SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
}

/** Never throws. A logging failure must not turn a delivered email into an
 *  error response, which would make the caller retry a send that worked. */
async function logEmail(entry: {
  booking_id: string;
  recipient: string;
  status: "sent" | "failed";
  provider_message_id?: string | null;
  error?: string | null;
}) {
  try {
    const res = await db("email_log", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ email_type: EMAIL_TYPE, ...entry }),
    });
    if (!res.ok) {
      const detail = await res.text();
      // 23505 = the partial unique index rejected a second SUCCESS for this
      // booking. That is the duplicate guard doing its job, not a fault.
      console.error("email_log insert failed", res.status, detail);
    }
  } catch (err) {
    console.error("email_log insert threw", err);
  }
}

/** Releases the claim so a failed send is retried on the next tick. Without
 *  this, review_request_sent_at stays set and the booking is never picked up
 *  again - one client silently never asked. */
async function clearClaim(bookingId: string) {
  try {
    await db(`booking_requests?id=eq.${bookingId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ review_request_sent_at: null }),
    });
  } catch (err) {
    console.error("could not clear review claim", err);
  }
}

/** Re-reads the live row and re-tests every condition. Returns the reason to
 *  skip, or null to proceed. */
async function reviewBlockedBecause(bookingId: string): Promise<string | null> {
  const res = await db(
    `booking_requests?id=eq.${bookingId}` +
      `&select=id,status,email,completed_at`,
  );
  if (!res.ok) return `booking lookup failed (${res.status})`;

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return "booking no longer exists";

  const b = rows[0];
  if (b.status !== "completed") return `status is now ${b.status}`;
  if (!looksLikeEmail(b.email)) return "no usable email address";
  if (!b.completed_at) return "completed_at is null";

  const waitedMs = Date.now() - new Date(b.completed_at).getTime();
  if (waitedMs < REVIEW_WAIT_HOURS * 3600000) {
    return `only ${Math.round(waitedMs / 3600000)}h since completion`;
  }

  // The claim column can be cleared by a retry, so the LOG is the authority on
  // whether this booking has already been successfully mailed.
  const seen = await db(
    `email_log?booking_id=eq.${bookingId}` +
      `&email_type=eq.${EMAIL_TYPE}&status=eq.sent&select=id&limit=1`,
  );
  if (seen.ok) {
    const prior = await seen.json();
    if (Array.isArray(prior) && prior.length > 0) return "already sent";
  }

  return null;
}

/* ---------------- templates ---------------- */

const shell = (inner: string) => `
<div style="margin:0;padding:24px 12px;background:${NOIR};font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:${ESPRESSO};border:1px solid #3b241d;border-radius:4px">
    <div style="padding:28px 28px 0">
      <img src="${SITE}/img/brand/logo-email.png" width="240"
           alt="Mirabelle.B &mdash; African Braiding &amp; Styling"
           style="display:block;border:0;width:240px;max-width:100%;height:auto;border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${IVORY}" />
      <p style="margin:10px 0 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${GILT}">
        African Hair Braiding &middot; Ashburn, VA
      </p>
    </div>
    <div style="padding:24px 28px 28px">${inner}
      <div style="margin:26px 0 0;padding:18px 0 0;border-top:1px solid #3b241d">
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">Mirabelle.B African Hair Braiding</p>
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">${SALON_ADDRESS}</p>
        <p style="margin:0;font-size:13px"><a href="${SITE}" style="color:${GILT};text-decoration:none">mimi-african-braiding-styling.com</a></p>
      </div>
    </div>
  </div>
</div>`;

const label = (t: string) =>
  `<p style="margin:22px 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${GILT}">${t}</p>`;

function reminderEmail(r: Record<string, unknown>) {
  const who = esc(firstName(r.name));
  const serviceRaw = String(r.service_name ?? r.style ?? "");
  const service = esc(serviceRaw);
  const dateRaw = prettyDate(r.appointment_date ?? r.preferred_date);
  const date = esc(dateRaw);
  const time = prettyTime(r.appointment_time);

  return {
    to: [String(r.email)],
    subject: `Reminder: your Mirabelle.B appointment ${time ? "tomorrow at " + time : "tomorrow"}`,
    text:
      `Hello ${firstName(r.name)},\n\n` +
      `A quick reminder of your appointment tomorrow.\n\n` +
      `Service: ${serviceRaw}\n` +
      `Date: ${dateRaw}\n` +
      (time ? `Time: ${time}\n` : "") +
      `Where: ${SALON_ADDRESS}\n` +
      `Phone: ${SALON_PHONE}\n\n` +
      `How to prepare: arrive with your hair washed, fully dried and ` +
      `detangled unless we agreed otherwise. If you are bringing your own ` +
      `hair, have it with you.\n\n` +
      `Need to change or cancel? Call or text ${SALON_PHONE} as soon as you ` +
      `can. We ask for at least 48 hours' notice — full policy at ` +
      `${CANCEL_POLICY}\n\n` +
      `See you tomorrow.\n\nMirabelle.B African Hair Braiding\n`,
    html: shell(`
      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:23px;font-weight:700;color:${IVORY};line-height:1.25">
        ${who}, we will see you tomorrow
      </h1>
      <table style="width:100%;border-collapse:collapse;background:${NOIR};border-left:2px solid ${GILT}">
        <tr><td style="padding:14px 18px">
          <table style="border-collapse:collapse">
            <tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Service</td>
                <td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${service}</td></tr>
            <tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Date</td>
                <td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${date}</td></tr>
            ${time ? `<tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Time</td><td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${esc(time)}</td></tr>` : ""}
          </table>
        </td></tr>
      </table>

      ${label("How to prepare")}
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        Arrive with your hair washed, fully dried and detangled unless we
        agreed otherwise. Bringing your own hair? Have it with you.
      </p>

      ${label("Where")}
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        ${SALON_ADDRESS}<br>
        <a href="${MAPS}" style="color:${GILT};text-decoration:none;font-weight:600">Get directions</a>
      </p>

      ${label("Need to change or cancel?")}
      <p style="margin:0;font-size:15px;line-height:1.65;color:${SAND}">
        Call or text
        <a href="tel:+15714260602" style="color:${GILT};font-weight:600;text-decoration:none">${SALON_PHONE}</a>
        as soon as you can. We ask for at least 48 hours' notice &mdash;
        <a href="${CANCEL_POLICY}" style="color:${GILT};text-decoration:underline">read the cancellation policy</a>.
      </p>`),
  };
}

function reviewEmail(r: Record<string, unknown>, url: string) {
  const who = esc(firstName(r.name));
  return {
    to: [String(r.email)],
    subject: "How was your Mirabelle.B experience? \u{1F495}",
    text:
      `Hi ${firstName(r.name)},\n\n` +
      `Thank you for choosing Mirabelle.B African Hair Braiding & Styling. ` +
      `We hope you're enjoying your new style!\n\n` +
      `We'd love to hear about your experience. Your honest feedback helps ` +
      `us improve and helps other clients learn about Mirabelle.B.\n\n` +
      `Leave a Google review: ${url}\n\n` +
      `Thank you,\nMirabelle.B African Hair Braiding & Styling\n`,
    html: shell(`
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:23px;font-weight:700;color:${IVORY};line-height:1.25">
        Hi ${who},
      </h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        Thank you for choosing Mirabelle.B African Hair Braiding &amp; Styling.
        We hope you're enjoying your new style!
      </p>
      <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:${SAND}">
        We'd love to hear about your experience. Your honest feedback helps us
        improve and helps other clients learn about Mirabelle.B.
      </p>
      <!-- Table-wrapped so Outlook, which renders through Word and drops
           display:inline-block on anchors, still shows a button. -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px">
        <tr><td style="border-radius:3px;background:${GILT}">
          <a href="${esc(url)}"
             style="display:inline-block;padding:14px 26px;color:${NOIR};font-size:15px;font-weight:700;letter-spacing:.06em;text-decoration:none;border-radius:3px">
            &#11088; Leave a Google Review
          </a>
        </td></tr>
      </table>
      <p style="margin:0;font-size:15px;line-height:1.65;color:${SAND}">
        Thank you,<br>
        Mirabelle.B African Hair Braiding &amp; Styling
      </p>`),
  };
}

/* ---------------- send ---------------- */

async function resendSend(payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, ...payload }),
  });
  const body = await res.text();
  let id: string | null = null;
  try {
    id = JSON.parse(body)?.id ?? null;
  } catch {
    /* Resend returned something non-JSON; the status still decides. */
  }
  return { ok: res.ok, status: res.status, id, body };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!RESEND_KEY) {
    console.error("send-scheduled: RESEND_API_KEY is not set");
    return new Response("Not configured", { status: 500 });
  }

  const { kind, record, review_url } = await req.json();
  if (!record?.email) return new Response("ok (no customer email)");

  /* ---- reminder: unchanged behaviour ---- */
  if (kind === "reminder") {
    const r = await resendSend(reminderEmail(record));
    if (!r.ok) {
      console.error("send-scheduled(reminder): resend failed", r.status, r.body);
      return new Response(`Resend ${r.status}: ${r.body}`, { status: 502 });
    }
    return new Response("ok (reminder)");
  }

  /* ---- review: re-check, send, log ---- */
  if (kind === "review") {
    // Belt and braces: the SQL side already refuses to select anyone when the
    // URL is unset, so this should be unreachable.
    if (!review_url) return new Response("ok (no review url configured)");

    const bookingId = String(record.id ?? "");
    if (!bookingId) return new Response("ok (no booking id)", { status: 400 });

    const blocked = await reviewBlockedBecause(bookingId);
    if (blocked) {
      // Not an error. The booking became ineligible between the claim and now,
      // which is exactly what the re-check exists to catch. The claim is
      // released only when the booking could still become eligible later.
      if (blocked !== "already sent") await clearClaim(bookingId);
      console.log(`send-scheduled(review): skipped - ${blocked}`);
      return new Response(`ok (skipped: ${blocked})`);
    }

    const to = String(record.email);
    const r = await resendSend(reviewEmail(record, review_url));

    if (!r.ok) {
      console.error("send-scheduled(review): resend failed", r.status, r.body);
      await logEmail({
        booking_id: bookingId,
        recipient: to,
        status: "failed",
        error: `Resend ${r.status}: ${r.body}`.slice(0, 500),
      });
      // Release the claim so the next scheduled run retries this booking.
      await clearClaim(bookingId);
      return new Response(`Resend ${r.status}: ${r.body}`, { status: 502 });
    }

    await logEmail({
      booking_id: bookingId,
      recipient: to,
      status: "sent",
      provider_message_id: r.id,
    });
    return new Response("ok (review)");
  }

  return new Response(`unknown kind: ${kind}`, { status: 400 });
});
