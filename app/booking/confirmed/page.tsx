import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "../../_components/Container";
import { Parting } from "../../_components/Parting";
import { SectionHeader } from "../../_components/SectionHeader";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "../../_lib/studio";
import { formatDeposit } from "../../_lib/stripe";

export const metadata: Metadata = {
  title: "Deposit received",
  robots: { index: false, follow: false },
};

/**
 * Where Stripe returns after a successful payment.
 *
 * Deliberately says nothing about *confirming* the booking: this page is only
 * evidence that the browser came back from Checkout, and anyone can navigate
 * to it. The webhook is what actually tells the studio money cleared.
 */
export default function BookingConfirmedPage() {
  return (
    <main className="flex-1 py-24 sm:py-32">
      <Container width="narrow">
        <SectionHeader
          as="h1"
          eyebrow="Thank you"
          title="Your deposit is in"
          lead={`We have your ${formatDeposit()} deposit, and your appointment is now held. Stripe has emailed you a receipt.`}
        />

        <Parting className="my-10" />

        <div className="flex flex-col gap-4 text-body text-ink-muted">
          <p>
            The deposit comes off the balance on the day. If we ever have to
            move or cancel your appointment, you get it back in full.
          </p>
          <p>
            Anything to add before your appointment, or need to move it? Call
            the studio on{" "}
            <a
              href={STUDIO_PHONE_HREF}
              data-numeric=""
              className="text-accent underline underline-offset-4"
            >
              {STUDIO_PHONE}
            </a>
            .
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-6">
          <Link
            href="/menu"
            className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
          >
            Back to the styles
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-body-sm text-ink-muted underline underline-offset-4"
          >
            Home
          </Link>
        </div>
      </Container>
    </main>
  );
}
