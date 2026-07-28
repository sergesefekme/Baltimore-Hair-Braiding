"use server";

import { headers } from "next/headers";
import { type CheckoutResult, createDepositSession } from "./stripe";

/** Trim and cap before anything is charged for. */
function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Starts a deposit payment.
 *
 * Reached only after Simi has confirmed a slot and sent the client here, so it
 * takes no booking decisions — it collects the deposit and lets the webhook
 * tell the studio when the money lands.
 *
 * Public endpoint: validate everything, and never let the caller choose the
 * amount. The amount comes from server config alone.
 */
export async function startDeposit(input: {
  name: string;
  email: string;
  reference: string;
}): Promise<CheckoutResult | { status: "invalid"; message: string }> {
  const name = clip(input?.name, 80);
  const email = clip(input?.email, 254);
  const reference = clip(input?.reference, 120);

  if (!name) {
    return { status: "invalid", message: "Tell us the name the booking is under." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      status: "invalid",
      message: "Check the email address — it is missing an @ or a domain.",
    };
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = host ? `${proto}://${host}` : "";

  return createDepositSession({ name, email, reference }, origin);
}
