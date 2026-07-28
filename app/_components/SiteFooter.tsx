import Link from "next/link";
import {
  STUDIO_ADDRESS_LINES,
  STUDIO_MAPS_HREF,
  STUDIO_PHONE,
  STUDIO_PHONE_HREF,
} from "../_lib/studio";
import { Container } from "./Container";
import { Parting } from "./Parting";

const HOURS = [
  { day: "Tue – Fri", time: "9:00 AM – 7:00 PM" },
  { day: "Saturday", time: "8:00 AM – 6:00 PM" },
  { day: "Sunday", time: "10:00 AM – 4:00 PM" },
  { day: "Monday", time: "Closed" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-surface-warm">
      <Container>
        <Parting className="pt-px" />

        <div className="grid gap-10 py-14 md:grid-cols-3">
          <div>
            <p className="text-h4 font-display text-ink">Mirabelle</p>
            <p className="mt-3 max-w-[28ch] text-body-sm text-ink-muted">
              Protective styling and braiding, by appointment.
            </p>
            {/* <address> is the right element here, and browsers italicise it
                by default — hence not-italic. */}
            {/* flex-col, because two inline-level links sit on the same line —
                the phone number ran straight onto the end of the street.
                <address> is the right element and browsers italicise it, hence
                not-italic. */}
            <address className="mt-4 flex flex-col items-start not-italic">
              <a
                href={STUDIO_MAPS_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col text-body-sm text-ink-muted transition-colors duration-150 ease-sweep hover:text-accent"
              >
                {STUDIO_ADDRESS_LINES.map((line) => (
                  <span key={line} data-numeric="">
                    {line}
                  </span>
                ))}
              </a>

              <a
                href={STUDIO_PHONE_HREF}
                className="mt-1 inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
                data-numeric=""
              >
                {STUDIO_PHONE}
              </a>
            </address>
          </div>

          <div>
            <h2 className="text-eyebrow uppercase text-ink-muted">Opening hours</h2>
            <dl className="mt-4 flex flex-col gap-1.5">
              {HOURS.map((row) => (
                <div key={row.day} className="flex justify-between gap-6">
                  <dt className="text-body-sm text-ink">{row.day}</dt>
                  <dd
                    data-numeric=""
                    className="text-body-sm text-ink-muted"
                  >
                    {row.time}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2 className="text-eyebrow uppercase text-ink-muted">Explore</h2>
            <ul className="mt-2 flex flex-col">
              {[
                { href: "/menu", label: "Styles & prices" },
                { href: "/about", label: "About" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-body-sm text-ink transition-colors duration-150 ease-sweep hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="border-t border-line py-6 text-caption text-ink-muted">
          © {new Date().getFullYear()} Mirabelle. Hair is not included unless a
          service says otherwise.
        </p>
      </Container>
    </footer>
  );
}
