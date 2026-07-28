import type { Metadata } from "next";
import { fraunces, archivo } from "./fonts";
import { BookingProvider } from "./_components/Booking";
import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";
import { getStyleNames } from "./_lib/services";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mirabelle",
    template: "%s — Mirabelle",
  },
  description:
    "Protective styling and braiding. Knotless and box braids, cornrows and twists, by appointment in Ashburn, VA.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Loaded here so every page's booking form offers the same list.
  const styles = await getStyleNames();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BookingProvider styles={styles}>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </BookingProvider>
      </body>
    </html>
  );
}
