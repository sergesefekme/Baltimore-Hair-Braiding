/**
 * Booking shapes and validation.
 *
 * Pure and dependency-free so the same rules run in the browser for instant
 * feedback AND on the server, where they are the ones that actually count —
 * a Server Action is a public POST endpoint and cannot trust its input.
 */

export type BookingInput = {
  name: string;
  phone: string;
  email: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** 24-hour, HH:MM. */
  time: string;
  style: string;
};

export type BookingErrors = Partial<Record<keyof BookingInput, string>>;

export const EMPTY_BOOKING: BookingInput = {
  name: "",
  phone: "",
  email: "",
  date: "",
  time: "",
  style: "",
};

/**
 * Errors say what went wrong and what to do about it — never an apology and
 * never a vague "invalid".
 */
export function validateBooking(
  values: BookingInput,
  today: string,
): BookingErrors {
  const errors: BookingErrors = {};

  if (!values.name.trim()) {
    errors.name = "Tell us what to call you.";
  } else if (values.name.trim().length > 80) {
    errors.name = "That name is longer than we can store. Shorten it a little.";
  }

  if (!values.phone.trim()) {
    errors.phone = "We need a number to confirm your slot.";
  } else if (values.phone.replace(/\D/g, "").length < 10) {
    errors.phone = "That looks too short for a phone number.";
  }

  if (!values.email.trim()) {
    errors.email = "We send the confirmation here.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Check the email address — it is missing an @ or a domain.";
  }

  if (!values.date) {
    errors.date = "Pick the day you would like.";
  } else if (today && values.date < today) {
    errors.date = "That date has passed. Pick a day from today onwards.";
  }

  if (!values.time) errors.time = "Roughly what time suits you?";

  return errors;
}

export type BookingResult =
  /**
   * Emailed to the studio. No money is taken here by design — Simi confirms
   * the slot is free first, then sends a deposit link.
   */
  | { status: "sent" }
  /** Server-side validation rejected it; errors mirror the client's shape. */
  | { status: "invalid"; errors: BookingErrors }
  /** Nothing configured to receive it. Logged, not delivered. */
  | { status: "unconfigured" }
  /** The provider refused or was unreachable. Logged, not delivered. */
  | { status: "failed" };
