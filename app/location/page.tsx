import type { Metadata } from "next";
import { BookingCta } from "../_components/BookingCta";
import { Container } from "../_components/Container";
import { Parting } from "../_components/Parting";
import { SectionHeader } from "../_components/SectionHeader";
import { ServiceArea } from "../_components/ServiceArea";
import {
  STUDIO_ADDRESS_LINES,
  STUDIO_DIRECTIONS_HREF,
  STUDIO_NAME,
  STUDIO_PHONE_MOBILE,
  STUDIO_PHONE_MOBILE_HREF,
  STUDIO_PHONE_OFFICE,
  STUDIO_PHONE_OFFICE_HREF,
} from "../_lib/studio";

export const metadata: Metadata = {
  title: "Location",
  description:
    "Mirabelle is one studio in Ashburn, VA. Find us on the map, get directions, and check whether your zip code is inside our service area.",
};

/**
 * Where the studio is, and whether we come to you.
 *
 * One address — this is not a store finder. The map, the pin and the distance
 * maths all read the same constants out of `app/_lib/studio.ts`.
 */
export default function LocationPage() {
  return (
    <main className="flex-1 py-16 sm:py-24">
      <Container>
        <SectionHeader
          as="h1"
          eyebrow="Location"
          title="One chair, in Ashburn"
          lead="Everything happens in a single studio, by appointment. If you would rather we came to you, check your zip code below."
        />

        <Parting className="my-10" />

        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[7fr_5fr]">
          <ServiceArea />

          {/* Server-rendered, so the address sits in the page's HTML for search
              engines rather than arriving with the map script. */}
          <aside className="lg:pt-1">
            <h2 className="text-eyebrow uppercase text-ink-muted">
              The studio
            </h2>

            {/* <address> is the right element and browsers italicise it by
                default, hence not-italic. */}
            <address className="mt-4 not-italic">
              <p className="text-h4 font-display text-ink">{STUDIO_NAME}</p>
              <p className="mt-2 flex flex-col text-body-sm text-ink-muted">
                {STUDIO_ADDRESS_LINES.map((line) => (
                  <span key={line} data-numeric="">
                    {line}
                  </span>
                ))}
              </p>

              <p className="mt-4">
                <a
                  href={STUDIO_DIRECTIONS_HREF}
                  // A new tab because it hands off to Google Maps, and losing
                  // the booking flow to a directions lookup would be a poor
                  // trade.
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                >
                  Get directions
                </a>
              </p>

              {/* Labelled, and laid out on a grid so the numbers align in a
                  column — same treatment as the footer, since both are contact
                  cards rather than an inline "call us". */}
              <span className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                <span className="text-caption text-ink-muted">Office</span>
                <a
                  href={STUDIO_PHONE_OFFICE_HREF}
                  data-numeric=""
                  className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                >
                  {STUDIO_PHONE_OFFICE}
                </a>

                <span className="text-caption text-ink-muted">Mobile</span>
                <a
                  href={STUDIO_PHONE_MOBILE_HREF}
                  data-numeric=""
                  className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                >
                  {STUDIO_PHONE_MOBILE}
                </a>
              </span>
            </address>

            <p className="mt-6 max-w-[38ch] text-body-sm text-ink-muted">
              Parking is on the street outside. There is no waiting room, so
              come at your appointment time rather than early.
            </p>
          </aside>
        </div>

        <Parting className="my-14" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-h2 font-display text-ink">
              Ready when you are
            </h2>
            <p className="mt-4 max-w-[52ch] text-body-sm text-ink-muted">
              Tell us what you have in mind and we will confirm the price and
              timing before anything is booked.
            </p>
          </div>
          <BookingCta />
        </div>
      </Container>
    </main>
  );
}
