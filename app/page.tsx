import Link from "next/link";
import { BookingCta } from "./_components/BookingCta";
import { Container } from "./_components/Container";
import { Parting } from "./_components/Parting";
import { PortraitFrame } from "./_components/PortraitFrame";
import { SectionHeader } from "./_components/SectionHeader";
import {
  STATUS_LABEL,
  STATUS_TONE,
  formatEventDate,
  formatEventTime,
  getUpcomingEvents,
} from "./_lib/events";
import { getStyleImages } from "./_lib/gallery";
import { formatDeposit } from "./_lib/stripe";
import type { Service } from "./_lib/services";
import { formatPrice, getFeaturedServices, slugify } from "./_lib/services";

export default async function Home() {
  const [flagged, events, images] = await Promise.all([
    // Over-fetch: some flagged styles may not have a photograph yet.
    getFeaturedServices(12),
    getUpcomingEvents(),
    getStyleImages(),
  ]);

  // A featured tile is nothing but a photograph, so only styles that actually
  // have one can be featured. Pairing each with its resolved path here — rather
  // than trusting the CSV and guessing a ".jpg" — means renaming, re-encoding
  // or removing an image can never leave a broken tile on the homepage.
  const featured = flagged
    .map((service) => ({
      service,
      // A style can have several photographs; the tile shows the first.
      src: images.get(slugify(service.name))?.[0],
    }))
    .filter((tile): tile is { service: Service; src: string } =>
      Boolean(tile.src),
    )
    .slice(0, 4);

  return (
    <main className="flex-1">
      {/* ---------------------------------------------------------------- HERO
          A split rather than a full-bleed band, and deliberately so: every
          photograph the studio has is under 590px wide, so stretching one
          across 1440px meant upscaling ~3.6× — soft, and cropped to a slice
          that lost the braids. Shown at roughly 490px it is close to native
          resolution and the whole portrait is visible.

          Text sits on the page ground here, not over the image, so it uses
          `text-ink` and needs no scrim. */}
      <section className="pb-section pt-12 sm:pt-16">
        <Container>
          {/* items-start, not items-center. Centring a 375px text block against
              a 550px image left 183px of dead space above AND below it, which
              made the hero float and read as unfinished. Aligned to the top,
              the headline starts where the eye expects it. */}
          <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[6fr_5fr]">
            <div>
              <p className="text-eyebrow uppercase text-accent">
                Braiding studio
              </p>
              <h1 className="mt-4 max-w-[15ch] text-hero font-display text-ink">
                Braids that never hurt to wear
              </h1>
              <p className="mt-6 max-w-[46ch] text-lead text-ink-muted">
                Knotless by default, because tension at the root is what makes a
                style ache by day three. Box braids, cornrows and twists.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <BookingCta />
                <Link
                  href="/menu"
                  className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                >
                  See styles &amp; prices
                </Link>
              </div>
            </div>

            {/* The source is 396px wide, so the frame is capped near that:
                asking for more only upscales. `sizes` is given in explicit
                pixels rather than a vw fraction because the vw hint made Next
                pick a 356px variant — smaller than the file we have. */}
            <PortraitFrame
              src="/images/hero.webp"
              alt="Fulani cornrows braided into long braids with curled ends"
              sweep="right"
              ratio="4/5"
              priority
              sizes="(max-width: 1024px) 92vw, 440px"
              className="mx-auto w-full max-w-[440px] lg:mx-0 lg:ml-auto"
            />
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------ FEATURED WORK */}
      {featured.length > 0 && (
        <section className="py-section">
          <Container>
            <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[5fr_7fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <SectionHeader
                  eyebrow="Most booked"
                  title="The styles people come back for"
                  lead="Every price is a starting point — length and thickness move it."
                />
                <Link
                  href="/menu"
                  className="mt-4 inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                >
                  See every service
                </Link>
              </div>

              <ul className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2">
                {featured.map(({ service, src }, index) => (
                  <li key={service.name}>
                    <Link
                      href={`/menu?style=${slugify(service.name)}`}
                      className="group block"
                    >
                      <PortraitFrame
                        src={src}
                        alt={`${service.name}, ${service.style}`}
                        ratio="3/4"
                        // Alternate the sweep so the grid does not read as a
                        // repeating stamp.
                        sweep={index % 2 === 0 ? "left" : "right"}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                      />
                      <h3 className="mt-4 text-h4 font-display text-ink transition-colors duration-150 ease-sweep group-hover:text-accent">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-caption text-ink-muted">
                        {service.style}
                        {service.duration ? ` · ${service.duration}` : ""}
                      </p>
                      <p data-numeric="" className="mt-1 text-body-sm text-ink">
                        from {formatPrice(service.price)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------------- EVENTS
          Omitted entirely when nothing is coming up — an empty "Upcoming"
          heading reads as a closed business. */}
      {events.length > 0 && (
        <section className="pb-section">
          <Container>
            <Parting className="mb-12" />
            <SectionHeader
              eyebrow="What's on"
              title="Coming up at the studio"
              lead="Pop-ups, clinics and workshops. Some need booking, some you can walk into."
            />

            <ul className="mt-10 border-t border-line">
              {events.map((event) => (
                <li
                  key={`${event.date}-${event.title}`}
                  className="grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-[10rem_1fr_auto] sm:items-baseline"
                >
                  <div>
                    <p data-numeric="" className="text-body-sm text-ink">
                      {formatEventDate(event.date)}
                    </p>
                    {event.time && (
                      <p data-numeric="" className="text-caption text-ink-muted">
                        {formatEventTime(event.time)}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-h4 font-display text-ink">
                      {event.title}
                    </h3>
                    <p className="mt-1 max-w-[60ch] text-caption text-ink-muted">
                      {event.location && `${event.location} · `}
                      {event.description}
                    </p>
                  </div>

                  {/* The word carries the state; colour only reinforces it. */}
                  <p
                    className={`text-eyebrow uppercase ${STATUS_TONE[event.status]}`}
                  >
                    {STATUS_LABEL[event.status]}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* ----------------------------------------------------- CLOSING PROMPT */}
      <section className="pb-section">
        <Container>
          <Parting className="mb-12" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-[18ch] text-h2 font-display text-ink">
                Tell us what you have in mind
              </h2>
              <p className="mt-4 max-w-[52ch] text-body-sm text-ink-muted">
                Send a request and we will confirm the price and timing before
                anything is booked. Once the slot is agreed, a{" "}
                {formatDeposit()} deposit holds it and comes off the balance on
                the day.
              </p>
            </div>
            <BookingCta />
          </div>
        </Container>
      </section>
    </main>
  );
}
