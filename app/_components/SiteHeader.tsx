"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookingCta } from "./BookingCta";
import { Parting } from "./Parting";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Styles & prices" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    // Captured now: by cleanup time the ref may point somewhere else, and the
    // sheet's own links unmount before the effect tears down.
    const trigger = triggerRef.current;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;

      // Trap focus inside the sheet.
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      // The trigger first: it is always what opened the sheet. `previous` is
      // only a fallback, and can be <body> when the sheet was opened without
      // the button ever taking focus.
      (trigger ?? previous)?.focus();
    };
  }, [menuOpen]);

  return (
    <>
      {/* The sheet below MUST stay outside <header>. `backdrop-blur` makes the
          header a containing block for fixed-position descendants, so a sheet
          nested inside it would size itself to the header instead of the
          viewport — and render transparent over the page. */}
      <header className="sticky top-0 z-30 border-b border-line bg-ground/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[72rem] items-center justify-between gap-6 px-6">
        <Link
          href="/"
          // min-h-11 for the tap target; the header is already 64px tall so
          // this costs no layout.
          className="inline-flex min-h-11 items-center text-h4 font-display text-ink"
          aria-label="Mirabelle, home"
        >
          Mirabelle
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    // text-body rather than text-body-sm: three short labels
                    // occupy 243px of a 1152px header, so the larger step costs
                    // nothing and 15px is mean for the primary navigation.
                    className="relative flex h-16 items-center text-body text-ink transition-colors duration-150 ease-sweep hover:text-accent"
                  >
                    {link.label}
                    {/* The only active-state treatment in the system. */}
                    {active && (
                      <Parting
                        size="sm"
                        className="absolute inset-x-0 bottom-4"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:block">
          <BookingCta className="h-11 px-6 text-body-sm">Book</BookingCta>
        </div>

        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-sm text-ink md:hidden"
        >
          <span className="sr-only">Open menu</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        </div>
      </header>

      {menuOpen && (
        <div
          id="mobile-menu"
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col bg-ground p-6 md:hidden"
        >
          <div className="flex h-16 items-center justify-between">
            <span className="text-h4 font-display text-ink">Mirabelle</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="-mr-2 inline-flex size-11 items-center justify-center rounded-sm text-ink"
            >
              <span className="sr-only">Close menu</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <Parting className="my-4" />

          <nav aria-label="Main" className="flex-1">
            <ul className="flex flex-col gap-2">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    // Closed here rather than in an effect on `pathname`:
                    // navigating keeps this component mounted, so the click is
                    // the actual event, and an effect would just be a
                    // roundabout way of reacting to it.
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-14 items-center text-h3 font-display text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <BookingCta className="w-full">Book an appointment</BookingCta>
        </div>
      )}
    </>
  );
}
