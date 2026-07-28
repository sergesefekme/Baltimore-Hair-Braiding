import { Fraunces, Archivo } from "next/font/google";

/**
 * Display face. The SOFT and WONK axes give slanted, organic terminals that
 * echo the fall of a braid — see docs/design/references/style-guide.md §3.
 * Headings only, never below 22px.
 */
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/** Body, UI and tabular figures. */
export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});
