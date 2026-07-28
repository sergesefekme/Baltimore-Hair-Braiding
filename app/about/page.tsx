import type { Metadata } from "next";
import { BookingCta } from "../_components/BookingCta";
import { Container } from "../_components/Container";
import { Parting } from "../_components/Parting";
import { PortraitFrame } from "../_components/PortraitFrame";
import { SectionHeader } from "../_components/SectionHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mirabelle is run by Simi Adeyemi, who spent eleven years nursing before she braided for a living.",
};

export default function AboutPage() {
  return (
    <main className="flex-1 py-16 sm:py-24">
      <Container>
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[7fr_5fr]">
          <div>
            <SectionHeader
              as="h1"
              eyebrow="About"
              title="Eleven years of telling people this won't hurt"
              lead="Mirabelle is run by Simi Adeyemi. She came to braiding sideways, and the way she works still shows it."
            />
          </div>

          <PortraitFrame
            src="/images/founder.webp"
            alt="Simi Adeyemi, founder of Mirabelle"
            // Braids fall down the left of this frame, so the sweep goes
            // bottom-left to follow them. On the right it cut her shoulder.
            sweep="left"
            ratio="4/5"
            sizes="(max-width: 1024px) 100vw, 34vw"
            caption="Simi, at the studio."
            className="lg:mt-2"
          />
        </div>

        <Parting className="my-14" />

        {/* Narrow measure: this is the one page on the site that is genuinely
            read rather than scanned. */}
        <div className="max-w-[62ch] flex flex-col gap-12">
          <section>
            <h2 className="text-h3 font-display text-ink">Before this</h2>
            <p className="mt-4 text-body text-ink-muted">
              Simi spent eleven years as a nurse, most of it in long-term care.
              People stayed for months. Nobody was coming to do their hair.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              So she did it — on breaks, at the end of shifts, sitting on the
              edge of a chair in a day room. Not because she was trained to.
              Because a woman who has been in the same bed for six weeks and
              catches herself in a mirror deserves better than what she saw.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              She got good at it the slow way. Evenings, weekends, her sister&apos;s
              head, then her sister&apos;s friends, then people she had never met
              who had been given her number.
            </p>
          </section>

          <section>
            <h2 className="text-h3 font-display text-ink">
              Why everything here is knotless
            </h2>
            <p className="mt-4 text-body text-ink-muted">
              Nursing teaches you one thing about tension: it is almost always
              the problem. A dressing pulled tight does more damage than the
              wound under it. A cannula taped without slack tears the skin it
              was meant to protect. You learn to leave room.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              A braid is the same. The ache people describe on day three, the
              tender patches at the hairline, the thinning edges that never
              quite come back — that is not the style. That is tension at the
              root, and it is avoidable.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              So knotless is the default here, not the upgrade. If you want a
              sealed root you can have one, and it will hold its shape longer.
              But you will be asked first, and you will be told what it costs
              you.
            </p>
          </section>

          <section>
            <h2 className="text-h3 font-display text-ink">The name</h2>
            <p className="mt-4 text-body text-ink-muted">
              There was a mirabelle tree outside the day room where she used to
              take her breaks — a small yellow plum, more stone than fruit,
              ignored by everyone. It dropped all over the path in August and
              nobody picked any of it up.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              She liked it. It got a name over the studio door.
            </p>
          </section>

          <section>
            <h2 className="text-h3 font-display text-ink">How it works now</h2>
            <p className="mt-4 text-body text-ink-muted">
              One chair, by appointment, most of a day per client. That is
              deliberate — a knotless install done properly takes the time it
              takes, and rushing it is how tension gets in. You will not be
              double-booked or left under a dryer while someone else is
              started.
            </p>
            <p className="mt-4 text-body text-ink-muted">
              Bring a picture if you have one. If what you want will not sit
              well on your hair, you will hear that before you have paid a
              deposit, not after.
            </p>
          </section>
        </div>

        <Parting className="my-14" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-h2 font-display text-ink">
              Come and sit in the chair
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
