import type { Metadata } from "next";
import { Container } from "../_components/Container";
import { DepositForm } from "../_components/DepositForm";
import { Parting } from "../_components/Parting";
import { SectionHeader } from "../_components/SectionHeader";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "../_lib/studio";
import { formatDeposit, isStripeConfigured } from "../_lib/stripe";

export const metadata: Metadata = {
  title: "Pay your deposit",
  // Reached by a link Simi sends, never by browsing. Keep it out of search.
  robots: { index: false, follow: false },
};

/**
 * Where a client pays their deposit, after the studio has confirmed the slot.
 *
 * Prefilled from the query string so Simi can forward one link. The values are
 * only labels on the payer's own payment — tampering with them changes nothing
 * that matters, and the amount is fixed server-side regardless.
 */
export default async function DepositPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  const configured = isStripeConfigured();

  return (
    <main className="flex-1 py-16 sm:py-24">
      <Container width="narrow">
        <SectionHeader
          as="h1"
          eyebrow="Deposit"
          title={`Hold your slot with a ${formatDeposit()} deposit`}
          lead="Simi has confirmed your appointment. The deposit holds the chair and comes off the balance on the day."
        />

        {first(params.ref) && (
          <>
            <Parting className="my-8" />
            <p className="text-eyebrow uppercase text-ink-muted">Your appointment</p>
            <p data-numeric="" className="mt-2 text-h4 font-display text-ink">
              {first(params.ref)}
            </p>
          </>
        )}

        <Parting className="my-8" />

        {configured ? (
          <DepositForm
            defaultName={first(params.name)}
            defaultEmail={first(params.email)}
            defaultReference={first(params.ref)}
            deposit={formatDeposit()}
          />
        ) : (
          <div className="rounded-md border border-line bg-surface-warm p-6">
            <p className="text-body-sm text-ink">
              Card payments are not switched on yet.
            </p>
            <p className="mt-2 text-body-sm text-ink-muted">
              Call the studio on{" "}
              <a
                href={STUDIO_PHONE_HREF}
                data-numeric=""
                className="text-accent underline underline-offset-4"
              >
                {STUDIO_PHONE}
              </a>{" "}
              and we will take the deposit over the phone.
            </p>
          </div>
        )}

        <Parting className="my-10" />

        <p className="max-w-[60ch] text-caption text-ink-muted">
          Refunded in full if we have to move or cancel your appointment. If you
          cancel with less than 48 hours&apos; notice the deposit is not
          refundable, because the chair cannot usually be filled that late.
        </p>
      </Container>
    </main>
  );
}
