"use server";

import { headers } from "next/headers";
import {
  type BookingInput,
  type BookingResult,
  validateBooking,
} from "./booking";
import { sendBookingRequestEmail } from "./booking-email";
import { isStripeConfigured } from "./stripe";

/** Trim and cap every field before it is validated or emailed. */
function sanitise(input: BookingInput): BookingInput {
  const clip = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  return {
    name: clip(input?.name, 80),
    phone: clip(input?.phone, 32),
    email: clip(input?.email, 254),
    date: clip(input?.date, 10),
    time: clip(input?.time, 5),
    style: clip(input?.style, 80),
  };
}

/** The request's own origin, so previews and production each link to themselves. */
async function currentOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

/**
 * Receives a booking request and emails it to the studio.
 *
 * **No payment happens here.** Simi confirms the slot is actually free first,
 * then sends the deposit link that rides along in her email. Taking money
 * before confirming availability means refunding people for slots that never
 * existed.
 *
 * This runs as a public POST endpoint — anyone who can reach the site can call
 * it — so it re-validates everything the browser already checked and never
 * trusts a field's shape or length.
 */
export async function submitBooking(
  input: BookingInput,
): Promise<BookingResult> {
  const values = sanitise(input);

  // Server time, not the browser's — a client can claim any "today" it likes.
  const today = new Date().toISOString().slice(0, 10);
  const errors = validateBooking(values, today);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  // A prefilled deposit link for Simi to forward once she has confirmed.
  // Omitted entirely when Stripe is not set up, so the email never promises a
  // payment route that does not exist.
  let depositUrl: string | null = null;
  if (isStripeConfigured()) {
    const origin = await currentOrigin();
    const reference = [values.style || "Appointment", values.date, values.time]
      .filter(Boolean)
      .join(" · ");
    const params = new URLSearchParams({
      name: values.name,
      email: values.email,
      ref: reference,
    });
    depositUrl = `${origin}/deposit?${params.toString()}`;
  }

  const result = await sendBookingRequestEmail(values, depositUrl);

  return result === "sent"
    ? { status: "sent" }
    : { status: result === "unconfigured" ? "unconfigured" : "failed" };
}
