/**
 * Stripe over the REST API with `fetch` — no SDK.
 *
 * The one thing the SDK really buys you is webhook signature verification, and
 * that is thirty lines of `node:crypto` (see app/api/stripe/webhook/route.ts).
 * Not worth a dependency for one call.
 */

const STRIPE_API = "https://api.stripe.com/v1";

/** What a deposit payment needs to know about who is paying and what for. */
export type DepositDetails = {
  name: string;
  email: string;
  /** Free text shown to the payer and to the studio, e.g. the date and style. */
  reference: string;
};

/** Deposit in cents. Stripe counts minor units; $50 is 5000. */
export function depositAmount(): number {
  const configured = Number.parseInt(process.env.DEPOSIT_AMOUNT_CENTS ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 5000;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** "$50" — for copy that has to state the deposit. */
export function formatDeposit(): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(depositAmount() / 100);
}

/**
 * Stripe's API takes form-encoded bodies with bracket notation for nesting,
 * e.g. `line_items[0][price_data][unit_amount]`.
 */
function encode(form: URLSearchParams, value: unknown, prefix: string): void {
  if (value === undefined || value === null) return;

  if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) {
      encode(form, inner, `${prefix}[${key}]`);
    }
    return;
  }

  form.append(prefix, String(value));
}

function toForm(payload: Record<string, unknown>): URLSearchParams {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    encode(form, value, key);
  }
  return form;
}

export type CheckoutResult =
  | { status: "created"; url: string }
  | { status: "unconfigured" }
  | { status: "failed" };

/**
 * Creates a Checkout Session for a deposit, on demand.
 *
 * Created when the client opens the deposit page rather than when they first
 * enquired, because Simi confirms availability first and a Checkout Session
 * expires within 24 hours of creation — a link generated at enquiry time would
 * often be dead by the time she sent it.
 *
 * Uses inline `price_data`, so there is no Product or Price to create in the
 * dashboard first.
 */
export async function createDepositSession(
  details: DepositDetails,
  origin: string,
): Promise<CheckoutResult> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { status: "unconfigured" };

  const payload = {
    mode: "payment",
    // Stripe emails its own receipt here, and it prefills the payment form.
    customer_email: details.email,
    success_url: `${origin}/booking/confirmed`,
    cancel_url: `${origin}/deposit`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: depositAmount(),
          product_data: {
            name: "Booking deposit",
            description: details.reference || "Deposit towards an appointment",
          },
        },
      },
    ],
    // Handed back by the webhook so the studio knows whose deposit landed.
    metadata: {
      name: details.name,
      email: details.email,
      reference: details.reference,
    },
  };

  try {
    const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: toForm(payload).toString(),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[stripe] checkout session failed (${response.status}): ${detail.slice(0, 300)}`,
      );
      return { status: "failed" };
    }

    const session = (await response.json()) as { url?: string };
    if (!session.url) {
      console.error("[stripe] checkout session returned no url");
      return { status: "failed" };
    }

    return { status: "created", url: session.url };
  } catch (error) {
    console.error(`[stripe] checkout session threw: ${String(error)}`);
    return { status: "failed" };
  }
}
