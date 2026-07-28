import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsvRecords } from "./csv";
import { slugify } from "./format";

export type Service = {
  category: string;
  name: string;
  /** Size or length variant — "Medium, mid-back", "6-8 rows". */
  style: string;
  /** Description with the trailing "Allow …" sentence removed. */
  description: string;
  /** "4-5 hours", extracted from the description. Undefined where not stated. */
  duration?: string;
  price: number;
  /** True where the price is exact rather than a starting point. */
  flatPrice: boolean;
  /** Flagged in the CSV's `featured` column; drives the homepage selection. */
  featured: boolean;
};

export type ServiceCategory = {
  name: string;
  description?: string;
  services: Service[];
};

/**
 * Categories priced exactly rather than "from". Braided styles vary in price
 * with length and thickness; a scalp treatment does not.
 */
const FLAT_PRICED = new Set(["Maintenance", "Add-Ons"]);

const CATEGORY_BLURBS: Record<string, string> = {
  "Box Braids":
    "Knotless unless you ask otherwise — it sits lighter on the scalp and there is no tension at the root.",
  Cornrows:
    "From a simple straight-back to freehand patterns drawn with you at the chair.",
  Twists:
    "Rope and two-strand twists, with or without extensions.",
  "Loc Styles":
    "Starter locs, maintenance for an established set, and temporary locs if you are not ready to commit.",
  Kids: "Gentle tension, shorter sittings, and we work at their pace.",
  Maintenance: "Book alongside a style, or on its own.",
};

/**
 * Duration is written as a closing sentence in the menu copy ("Allow 4-5
 * hours.") rather than held in its own column. Pulling it out here keeps the
 * component honest — it renders a real field, not a string it has to slice.
 *
 * Degrades quietly: rows without the sentence simply have no duration, and the
 * description is left untouched.
 */
function extractDuration(description: string): {
  duration?: string;
  rest: string;
} {
  const match = description.match(/\s*\bAllow\s+(.+)\.\s*$/);
  if (!match) return { rest: description };

  return {
    duration: match[1].trim(),
    rest: description.slice(0, match.index).trim(),
  };
}

let cache: ServiceCategory[] | undefined;

/**
 * Reads the service menu at build time. Replaced by a Sanity query once the
 * CMS is wired — the shape of `ServiceCategory` is the contract to preserve.
 */
export async function getServiceMenu(): Promise<ServiceCategory[]> {
  if (cache) return cache;

  const file = path.join(process.cwd(), "docs", "items.csv");
  const records = parseCsvRecords(await readFile(file, "utf8"));

  const byCategory = new Map<string, Service[]>();

  for (const record of records) {
    if (!record.name || !record.category) continue;

    const price = Number.parseInt(record.price, 10);
    if (!Number.isFinite(price)) continue;

    const { duration, rest } = extractDuration(record.description ?? "");

    const service: Service = {
      category: record.category,
      name: record.name,
      style: record.style ?? "",
      description: rest,
      duration,
      price,
      flatPrice: FLAT_PRICED.has(record.category),
      // Column may be absent entirely on an older CSV — that reads as false.
      featured: /^(yes|true|1)$/i.test(record.featured ?? ""),
    };

    const existing = byCategory.get(service.category);
    if (existing) existing.push(service);
    else byCategory.set(service.category, [service]);
  }

  // Map preserves insertion order, so categories follow the CSV.
  cache = [...byCategory.entries()].map(([name, services]) => ({
    name,
    description: CATEGORY_BLURBS[name],
    services,
  }));

  return cache;
}

/** One price variant of a style — a size, length or row count. */
export type StyleVariant = {
  /** "Medium, mid-back", "6-8 rows". */
  style: string;
  description: string;
  duration?: string;
  price: number;
  flatPrice: boolean;
};

/**
 * A style as a customer thinks of it: one name, one photograph, and the
 * variants you can book it in. `items.csv` stores a row per variant, which is
 * right for pricing and wrong for browsing.
 */
export type StyleGroup = {
  name: string;
  category: string;
  /** Matches the photo filename in public/images/styles/. */
  slug: string;
  /** Cheapest variant, for the "from" price on a card. */
  fromPrice: number;
  /** True when every variant is flat-priced, so the card drops the "from". */
  flatPrice: boolean;
  variants: StyleVariant[];
};

/** Categories that are actual styles, as opposed to upkeep and extras. */
const STYLE_CATEGORIES = new Set([
  "Box Braids",
  "Cornrows",
  "Twists",
  "Loc Styles",
  "Crochet",
  "Kids",
]);

/**
 * Unique style names for the booking form's picker. Deduplicated because a
 * style appears once per size variant ("Knotless Box Braids" three times), and
 * someone booking picks the style, not the variant.
 */
export async function getStyleNames(): Promise<string[]> {
  const menu = await getServiceMenu();
  const names = new Set<string>();

  for (const category of menu) {
    if (!STYLE_CATEGORIES.has(category.name)) continue;
    for (const service of category.services) names.add(service.name);
  }

  return [...names];
}

/**
 * Styles flagged `featured` in items.csv, for the homepage. Deduplicated by
 * name and capped, since the homepage leads with a handful rather than a list.
 */
export async function getFeaturedServices(limit = 4): Promise<Service[]> {
  const menu = await getServiceMenu();
  const seen = new Set<string>();
  const featured: Service[] = [];

  for (const category of menu) {
    for (const service of category.services) {
      if (!service.featured || seen.has(service.name)) continue;
      seen.add(service.name);
      featured.push(service);
    }
  }

  return featured.slice(0, limit);
}

/**
 * The menu, regrouped for browsing: one entry per style name, carrying its
 * variants. Order follows the CSV, so categories stay in the sequence the
 * business thinks in.
 */
export async function getStyleGroups(): Promise<StyleGroup[]> {
  const menu = await getServiceMenu();
  const groups = new Map<string, StyleGroup>();

  for (const category of menu) {
    for (const service of category.services) {
      // Key on category too: a name repeated across categories is a different
      // service, not another variant of the same one.
      const key = `${category.name}::${service.name}`;
      const variant: StyleVariant = {
        style: service.style,
        description: service.description,
        duration: service.duration,
        price: service.price,
        flatPrice: service.flatPrice,
      };

      const existing = groups.get(key);
      if (existing) {
        existing.variants.push(variant);
        existing.fromPrice = Math.min(existing.fromPrice, variant.price);
        existing.flatPrice = existing.flatPrice && variant.flatPrice;
      } else {
        groups.set(key, {
          name: service.name,
          category: category.name,
          slug: slugify(service.name),
          fromPrice: variant.price,
          flatPrice: variant.flatPrice,
          variants: [variant],
        });
      }
    }
  }

  return [...groups.values()];
}

/** Category names in CSV order, for the filter chips. */
export async function getCategoryNames(): Promise<string[]> {
  return (await getServiceMenu()).map((category) => category.name);
}

export { formatPrice, slugify } from "./format";
