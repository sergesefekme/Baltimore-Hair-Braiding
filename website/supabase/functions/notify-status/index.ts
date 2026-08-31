/* Emails the customer when the salon confirms — or moves — their appointment.
 *
 * Invoked by the BEFORE UPDATE trigger on public.booking_requests, which
 * fires on the transition into 'confirmed' or on a date/time change while
 * already confirmed. Living in the database rather than the dashboard means
 * the email sends however the change was made — admin page, Supabase Studio,
 * or a future automation. There is no path that confirms an appointment
 * silently.
 *
 * `is_reschedule` is set by the trigger when the slot moved on a booking the
 * client has already been told about. The wording changes; the facts do not.
 *
 * Same verified sender as notify-booking. RESEND_API_KEY must be set as an
 * Edge Function secret.
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

/** "10:00:00" -> "10:00 AM". Returns "" when no slot was set, so the email
 *  omits the line rather than printing a bogus midnight. */
function prettyTime(t: unknown): string {
  const m = /^(\d{2}):(\d{2})/.exec(String(t ?? ""));
  if (!m) return "";
  let h = +m[1];
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m[2]} ${suffix}`;
}

function firstName(full: unknown): string {
  const s = String(full ?? "").trim();
  return s ? s.split(/\s+/)[0] : "there";
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!RESEND_KEY) {
    console.error("notify-status: RESEND_API_KEY is not set");
    return new Response("Not configured", { status: 500 });
  }

  const { record } = await req.json();
  if (!record) return new Response("No record", { status: 400 });

  if (record.status !== "confirmed") {
    return new Response(`ignored (status ${record.status})`);
  }
  // No address, nothing to send. Not an error: email is optional on the form.
  if (!record.email) return new Response("ok (no customer email)");

  const moved = record.is_reschedule === true;
  const who = esc(firstName(record.name));
  const serviceRaw = String(record.service_name ?? record.style ?? "");
  const service = esc(serviceRaw);
  const dateRaw = prettyDate(record.appointment_date ?? record.preferred_date);
  const date = esc(dateRaw);
  const time = prettyTime(record.appointment_time);

  const subject = moved
    ? "Your Mirabelle.B Appointment Has Been Moved"
    : "Your Mirabelle.B Appointment Is Confirmed";

  const opening = moved
    ? "Your appointment has been moved. Here are the new details."
    : "Your appointment is confirmed.";

  const timeRow = time
    ? `<tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Time</td>` +
      `<td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${esc(time)}</td></tr>`
    : "";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [record.email],
      subject,
      text:
        `Hello ${firstName(record.name)},\n\n` +
        `${opening}\n\n` +
        `Service: ${serviceRaw}\n` +
        `Date: ${dateRaw}\n` +
        (time ? `Time: ${time}\n` : "") +
        `\nPlease arrive on time and follow the preparation instructions below.\n\n` +
        `Come with your hair washed, fully dried and detangled unless we agreed ` +
        `otherwise. If you are bringing your own hair, have it with you.\n\n` +
        `Where: ${SALON_ADDRESS}\n\n` +
        `Need to change or cancel? Please give at least 48 hours' notice — call ` +
        `or text ${SALON_PHONE}.\n\n` +
        `We look forward to seeing you!\n\n` +
        `Mirabelle.B African Hair Braiding\n${SALON_ADDRESS}\n${SITE}\n`,
      html: `
<div style="margin:0;padding:24px 12px;background:${NOIR};font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:${ESPRESSO};border:1px solid #3b241d;border-radius:4px">
    <div style="padding:28px 28px 0">
      <!-- Absolute URL: an email has no site to be relative to.
           BOTH a width attribute and inline width: Outlook on Windows renders
           through Word, which honours the HTML attribute and ignores much of
           the CSS, while Gmail and Apple Mail take the CSS. Giving only one of
           them is how a logo ends up full-bleed in one client and thumbnail in
           another. height:auto rather than a fixed height so it can never be
           stretched if the source aspect ratio ever changes.
           max-width:100% keeps it inside a narrow phone viewport.
           The alt text is styled so that a client blocking images still shows
           the wordmark rather than bare default type.
           Source is 520px for a true 2x at this size. -->
      <img src="${SITE}/img/brand/logo-email.png" width="240"
           alt="Mirabelle.B — African Braiding &amp; Styling"
           style="display:block;border:0;width:240px;max-width:100%;height:auto;border-radius:50%;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:${IVORY}" />
      <p style="margin:10px 0 0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:${GILT}">
        African Hair Braiding &middot; Ashburn, VA
      </p>
    </div>

    <div style="padding:24px 28px 28px">
      <p style="margin:0 0 16px;font-size:17px;line-height:1.5;color:${IVORY}">
        Hello ${who},
      </p>

      <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SAND}">
        <strong style="color:${GILT}">${esc(opening)}</strong>
      </p>

      <table style="width:100%;border-collapse:collapse;background:${NOIR};border-left:2px solid ${GILT}">
        <tr><td style="padding:14px 18px">
          <table style="border-collapse:collapse">
            <tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Service</td>
                <td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${service}</td></tr>
            <tr><td style="padding:7px 16px 7px 0;color:${TAUPE};font-size:14px">Date</td>
                <td style="padding:7px 0;color:${IVORY};font-size:15px;font-weight:600">${date}</td></tr>
            ${timeRow}
          </table>
        </td></tr>
      </table>

      <p style="margin:20px 0 0;font-size:15px;line-height:1.65;color:${SAND}">
        Please arrive on time and follow the preparation instructions below.
      </p>

      <p style="margin:22px 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${GILT}">How to prepare</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        Come with your hair washed, fully dried and detangled unless we agreed
        otherwise. Undone hair eats into your appointment and into the result.
        Bringing your own hair? Have it with you.
      </p>

      <p style="margin:0 0 6px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:${GILT}">Where</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:${SAND}">
        ${SALON_ADDRESS}<br>
        <a href="${MAPS}" style="color:${GILT};text-decoration:none;font-weight:600">Get directions</a>
      </p>

      <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${SAND}">
        Need to change or cancel? Please give at least 48 hours' notice — call
        or text <a href="tel:+15714260602" style="color:${GILT};font-weight:600;text-decoration:none">${SALON_PHONE}</a>.
      </p>

      <p style="margin:0;font-size:16px;line-height:1.6;color:${IVORY}">
        We look forward to seeing you!
      </p>

      <div style="margin:26px 0 0;padding:18px 0 0;border-top:1px solid #3b241d">
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">Mirabelle.B African Hair Braiding</p>
        <p style="margin:0 0 3px;font-size:13px;color:${TAUPE}">${SALON_ADDRESS}</p>
        <p style="margin:0;font-size:13px"><a href="${SITE}" style="color:${GILT};text-decoration:none">mimi-african-braiding-styling.com</a></p>
      </div>
    </div>
  </div>
</div>`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("notify-status: resend failed", res.status, detail);
    return new Response(`Resend ${res.status}: ${detail}`, { status: 502 });
  }
  return new Response(moved ? "ok (reschedule)" : "ok (confirmed)");
});
