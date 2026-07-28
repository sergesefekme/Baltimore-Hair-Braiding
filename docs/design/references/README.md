# Mirabelle — Design System

The complete visual system for the Mirabelle braiding site, derived from the
nine reference photographs in this folder.

| File | What it is |
|---|---|
| [`style-guide.md`](./style-guide.md) | The visual language — how the references became a palette, type pairing, layout and voice. Read this first. |
| [`design-tokens.md`](./design-tokens.md) | Every token, with measured contrast ratios. |
| [`tokens.css`](./tokens.css) | **The implementation.** Copy into `app/globals.css`. |
| [`components.md`](./components.md) | Specs for all 22 components, with props and build order. |

**Built for:** Next.js 16.2.12 (App Router) · React 19.2.4 · Tailwind CSS 4.3.3
· TypeScript 5 · `next/font/google` · `next/image`

---

## The idea in one paragraph

The nine references share no single colour, but they do share a *material*: the
parting. The fulani, cornrow and lemonade styles are precise geometric line
work on the scalp, and that geometry — parallel lines whose spacing opens out —
is the one thing that belongs to this business and nobody else. It became the
system's signature, a five-hairline rule used for section breaks, active nav and
service-row hover. Everything else stays quiet so that stays loud.

The photographs also split cleanly between golden-hour field and cool city dusk.
That split became the two themes: light is *Field*, dark is *Dusk* — a
different time of day rather than an inversion.

---

## Getting started

```bash
# 1. Replace the generated stylesheet with the token system
cp docs/design/references/tokens.css app/globals.css
```

Then create `app/fonts.ts` and wire the font variables into `app/layout.tsx` —
both snippets are in [style-guide.md §3](./style-guide.md#loading-appfontsts).

Build components in the order given at the end of
[components.md](./components.md#build-order); foundations gate everything else.

---

## Three rules that keep it coherent

1. **Never use a primitive in a component.** `bg-[#A8542E]` breaks theming.
   Use `bg-accent`.
2. **Never write a `dark:` colour class.** Colour resolves at the token layer,
   so `bg-surface` is already right in both themes. Needing `dark:bg-…` means a
   token is missing — add it to `tokens.css`.
3. **Honey is not text in the light theme.** `#C89440` measures 2.56:1 against
   the ground. Use `--mb-highlight-text` (`#8A6420`, 5.06:1) when it must be
   read.

---

## Two things this system does not decide

**The photographs are stock and must be replaced before launch.** A braiding
business sells its own hands; licensed images of other people's work undercut
the entire proposition. Shooting direction is in
[style-guide.md §8](./style-guide.md#8-photography-direction).

**The service names and prices are placeholders.** `components.md` uses
"Knotless box braids · 4–5 hrs · from £120" throughout as a worked example. Real
names, durations and prices need to come from the business before the price
list is built — it is the most-visited page on a salon site and the one that
must not be approximated.
