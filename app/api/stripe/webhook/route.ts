import crypto from "node:crypto";
import { sendDepositPaidEmail } from "../../../_lib/booking-email";
import type { DepositDetails } from "../../../_lib/stripe";

// node:crypto and the raw request body both need the Node runtime.
export const runtime = "nodejs";
// A webhook must never be served from a cache.
export const dynamic = "force-dynamic";

/** Reject anything older than this, so a captured request cannot be replayed. */
const TOLERANCE_SECONDS = 300;

/**
 * Verifies Stripe's `Stripe-Signature` header.
 *
 * Format: `t=<unix>,v1=<hex hmac>[,v1=<hex hmac>...]`. The signed payload is
 * `${timestamp}.${rawBody}`, HMAC-SHA256 with the endpoint's signing secret.
 * Multiple v1 values appear while a secret is being rotated, so any match wins.
 */
function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header) return false;

  let timestamp = "";
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t") timestamp = value;
    if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return signatures.some((candidate) => {
    const candidateBuffer = Buffer.from(candidate, "utf8");
    // timingSafeEqual throws on length mismatch, so guard first.
    return (
      candidateBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}

type StripeEvent = {
  type?: string;
  data?: {
    object?: {
      payment_status?: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] webhook received but STRIPE_WEBHOOK_SECRET is unset");
    return new Response("Webhook not configured", { status: 500 });
  }

  // Raw text, not request.json() — the signature covers the exact bytes sent.
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("stripe-signature"), secret)) {
    // Anyone can POST here; an unsigned request is not from Stripe.
    return new Response("Invalid signature", { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return new Response("Malformed payload", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    // Acknowledge everything else so Stripe stops retrying it.
    return new Response("Ignored", { status: 200 });
  }

  const session = event.data?.object;
  if (session?.payment_status !== "paid") {
    return new Response("Not paid", { status: 200 });
  }

  const meta = session.metadata ?? {};
  const details: DepositDetails = {
    name: meta.name ?? "",
    email: meta.email ?? "",
    reference: meta.reference ?? "",
  };

  if (!details.name || !details.email) {
    console.error("[stripe] paid session missing deposit metadata");
    // 200 regardless: retrying will not conjure the metadata, and a failing
    // endpoint gets disabled by Stripe.
    return new Response("Missing metadata", { status: 200 });
  }

  const result = await sendDepositPaidEmail(details);

  if (result === "failed") {
    // A 500 makes Stripe retry, which is what we want — the money is taken and
    // the studio does not know yet.
    return new Response("Notification failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
