/* Emails the salon when a booking request lands.
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
 */

const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
// Falls back to the salon's own address so a forgotten secret degrades to
// "mail still arrives" rather than "bookings vanish".
const NOTIFY_TO =
  Deno.env.get("BOOKING_NOTIFY_TO") ?? "mirabellekamga4@gmail.com";

// When the salon registers its own domain, verify it at Resend and set
// BOOKING_NOTIFY_FROM. Nothing else changes.
const FROM =
  Deno.env.get("BOOKING_NOTIFY_FROM") ??
  "Mirabelle.B Bookings <bookings@mimi-african-braiding-styling.com>";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

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

  const rows = [
    ["Name", record.name],
    ["Phone", record.phone],
    ["Email", record.email || "—"],
    ["Style", record.style],
    ["Preferred", `${record.preferred_date} (${record.preferred_time || "any time"})`],
    ["Notes", record.notes || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#9a8778">${esc(k)}</td>` +
        `<td style="padding:6px 0;color:#100b09"><strong>${esc(v)}</strong></td></tr>`
    )
    .join("");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [NOTIFY_TO],
      // Replying goes straight to the client when they left an address.
      reply_to: record.email || undefined,
      subject: `New booking: ${record.name} — ${record.style} on ${record.preferred_date}`,
      html:
        `<h2 style="font-family:Georgia,serif;color:#100b09">New booking request</h2>` +
        `<table style="font-family:system-ui,sans-serif;font-size:15px">${rows}</table>` +
        `<p style="font-family:system-ui,sans-serif;font-size:13px;color:#9a8778">` +
        `Received ${esc(record.created_at)}</p>`,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("notify-booking: resend failed", res.status, detail);
    return new Response(`Resend ${res.status}: ${detail}`, { status: 502 });
  }

  return new Response("ok");
});
