/* Reminder and review-request emails.
 *
 * Called per due appointment by the pg_cron jobs in phase5_scheduled_jobs.
 * The SQL side decides WHO is due and stamps the sent-at column in the same
 * transaction as the call; this function only renders and sends. Keeping the
 * selection in SQL means the idempotency guard and the send cannot drift
 * apart, which is the usual way a reminder system starts mailing people
 * twice.
 *
 * Cancelled appointments never reach here: send_appointment_reminders()
 * selects on status = 'confirmed'.
 *
 * Body: { kind: "reminder" | "review", record: {...}, review_url?: string }
 */

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
const FROM =
  Deno.env.get("BOOKING_NOTIFY_FROM") ??
  "Mirabelle.B Bookings <bookings@mimi-african-braiding-styling.com>";

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

const shell = (inner: string) => `
<div style="margin:0;padding:24px 12px;background:${NOIR};font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:${ESPRESSO};border:1px solid #3b241d;border-radius:4px">
    <div style="padding:28px 28px 0">
      <!-- Absolute URL: an email has no site to be relative to. Sized and
           styled inline so that a client blocking images still renders the
           alt text as the wordmark rather than as bare default type. -->
      <img src="${SITE}/img/brand/logo-full-340.png" width="84" height="84"
           alt="Mirabelle.B"
           style="display:block;border:0;width:84px;height:84px;border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:${IVORY}" />
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
        as soon as you can. We ask for at least 48 hours' notice —
        <a href="${CANCEL_POLICY}" style="color:${GILT};text-decoration:underline">read the cancellation policy</a>.
      </p>`),
  };
}

function reviewEmail(r: Record<string, unknown>, url: string) {
  const who = esc(firstName(r.name));
  return {
    to: [String(r.email)],
    subject: "How did we do?",
    text:
      `Hello ${firstName(r.name)},\n\n` +
      `Thank you for choosing Mirabelle.B. We hope you love your new braids.\n\n` +
      `If you enjoyed your visit, would you take a moment to leave a Google ` +
      `review? It helps other clients find us, and it genuinely helps a small ` +
      `business grow.\n\n${url}\n\n` +
      `And if anything was not right, please tell us first — call or text ` +
      `${SALON_PHONE} and we will put it right.\n\n` +
      `Thank you,\nMirabelle.B African Hair Braiding\n`,
    html: shell(`
      <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:23px;font-weight:700;color:${IVORY};line-height:1.25">
        ${who}, how did we do?
      </h1>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        Thank you for choosing Mirabelle.B. We hope you love your new braids.
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${SAND}">
        If you enjoyed your visit, would you take a moment to leave a Google
        review? It helps other clients find us, and it genuinely helps a small
        business grow.
      </p>
      <p style="margin:0 0 22px">
        <a href="${esc(url)}" style="display:inline-block;padding:13px 22px;background:${GILT};color:${NOIR};font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border-radius:3px">
          Leave a Google review
        </a>
      </p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:${SAND}">
        And if anything was not right, please tell us first — call or text
        <a href="tel:+15714260602" style="color:${GILT};font-weight:600;text-decoration:none">${SALON_PHONE}</a>
        and we will put it right.
      </p>`),
  };
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

  let payload;
  if (kind === "reminder") {
    payload = reminderEmail(record);
  } else if (kind === "review") {
    // Belt and braces: the SQL side already refuses to select anyone when the
    // URL is unset, so this should be unreachable.
    if (!review_url) return new Response("ok (no review url configured)");
    payload = reviewEmail(record, review_url);
  } else {
    return new Response(`unknown kind: ${kind}`, { status: 400 });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, ...payload }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`send-scheduled(${kind}): resend failed`, res.status, detail);
    return new Response(`Resend ${res.status}: ${detail}`, { status: 502 });
  }
  return new Response(`ok (${kind})`);
});
