import type { BookingInput } from "./booking";
import { type DepositDetails, formatDeposit } from "./stripe";

/** Escapes user input before it goes near the HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingSummary(values: BookingInput): string {
  return `${values.name} · ${values.phone} · ${values.email} · ${values.date} ${values.time} · ${values.style || "no preference"}`;
}

export type EmailResult = "sent" | "unconfigured" | "failed";

function credentials() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    to: process.env.BOOKING_TO_EMAIL,
    from: process.env.BOOKING_FROM_EMAIL,
  };
}

async function send(
  subject: string,
  html: string,
  replyTo: string,
  logLine: string,
): Promise<EmailResult> {
  const { apiKey, to, from } = credentials();

  if (!apiKey || !to || !from) {
    // Log rather than drop it. Until the keys exist this is the only record.
    console.warn(`[booking] email not configured. ${logLine}`);
    return "unconfigured";
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Replying goes straight back to the client rather than to the studio.
        reply_to: replyTo,
        subject,
        html,
      }),
      // Never let a hanging provider hold the request open.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[booking] email send failed (${response.status}): ${detail.slice(0, 300)}. ${logLine}`,
      );
      return "failed";
    }

    return "sent";
  } catch (error) {
    console.error(`[booking] email send threw: ${String(error)}. ${logLine}`);
    return "failed";
  }
}

/**
 * Tells the studio someone has asked for an appointment.
 *
 * No money has changed hands at this point. The email carries a deposit link
 * for Simi to send on **after** she has confirmed the slot is free — that
 * ordering is the whole point, so the copy says it plainly.
 */
export async function sendBookingRequestEmail(
  values: BookingInput,
  depositUrl: string | null,
): Promise<EmailResult> {
  const rows: Array<[string, string]> = [
    ["Name", values.name],
    ["Phone", values.phone],
    ["Email", values.email],
    ["Preferred date", values.date],
    ["Preferred time", values.time],
    ["Style", values.style || "No preference yet"],
  ];

  const depositBlock = depositUrl
    ? `<p><strong>Once you have confirmed the slot</strong>, send them this link to pay the
       ${escapeHtml(formatDeposit())} deposit:<br>
       <a href="${escapeHtml(depositUrl)}">${escapeHtml(depositUrl)}</a></p>
       <p>You will get a second email when the deposit lands.</p>`
    : "";

  const html = `
    <h2>New booking request</h2>
    <p>No deposit taken yet. Nothing is confirmed until you reply to them.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    ${depositBlock}
  `;

  return send(
    `Booking request — ${values.name}, ${values.date}`,
    html,
    values.email,
    `Request received: ${bookingSummary(values)}`,
  );
}

/** Tells the studio a deposit has actually cleared. */
export async function sendDepositPaidEmail(
  details: DepositDetails,
): Promise<EmailResult> {
  const html = `
    <h2>Deposit paid — ${escapeHtml(formatDeposit())}</h2>
    <p>The slot is now held. This is the confirmation you were waiting for.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(details.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(details.email)}</td></tr>
      <tr><td><strong>For</strong></td><td>${escapeHtml(details.reference || "—")}</td></tr>
    </table>
  `;

  return send(
    `Deposit paid — ${details.name}`,
    html,
    details.email,
    `DEPOSIT PAID: ${details.name} · ${details.email} · ${details.reference}`,
  );
}
