import type { Metadata } from "next";
import { Container } from "../_components/Container";
import { MenuBrowser } from "../_components/MenuBrowser";
import { Parting } from "../_components/Parting";
import { SectionHeader } from "../_components/SectionHeader";
import { getStyleImages } from "../_lib/gallery";
import { getCategoryNames, getStyleGroups } from "../_lib/services";
import { formatDeposit } from "../_lib/stripe";

export const metadata: Metadata = {
  title: "Styles & prices",
  description:
    "Every style we braid — knotless and box braids, cornrows and twists — with timings and prices.",
};

export default async function MenuPage() {
  const [groups, categories, imageMap] = await Promise.all([
    getStyleGroups(),
    getCategoryNames(),
    getStyleImages(),
  ]);

  // Maps do not serialise across the server/client boundary.
  const images: Record<string, string[]> = Object.fromEntries(imageMap);

  return (
    <main className="flex-1 py-16 sm:py-24">
      <Container>
        <SectionHeader
          as="h1"
          eyebrow="The menu"
          title="Every style we braid"
          lead="Tap any style for its timings, sizes and prices. Every price is a starting point — length and thickness move it."
        />

        <Parting className="my-10" />

        <MenuBrowser groups={groups} categories={categories} images={images} />

        <Parting className="mt-16 mb-8" />

        <p className="max-w-[52ch] text-body-sm text-ink-muted">
          Hair is not included unless a service says otherwise. Once Simi has
          confirmed your slot, a {formatDeposit()} deposit holds it and comes
          off the balance on the day.
        </p>
      </Container>
    </main>
  );
}
