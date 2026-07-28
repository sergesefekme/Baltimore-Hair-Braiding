"use client";

import { useBooking } from "./Booking";

type BookingCtaProps = {
  /** Pre-selects a style in the form. */
  service?: string;
  /**
   * `sticky` pins it to the bottom of the viewport on mobile — one per page,
   * and never inside the header, which has its own inline copy.
   */
  sticky?: boolean;
  children?: React.ReactNode;
  className?: string;
};

/**
 * The only pill in the system. Its shape is what makes it findable, which is
 * why nothing else is allowed to use `rounded-pill`.
 */
export function BookingCta({
  service,
  sticky = false,
  children = "Book an appointment",
  className = "",
}: BookingCtaProps) {
  const { open } = useBooking();

  const base =
    "inline-flex h-13 items-center justify-center rounded-pill bg-accent px-8 text-body text-on-accent transition-colors duration-150 ease-sweep hover:bg-accent-hover";

  if (!sticky) {
    return (
      <button
        type="button"
        onClick={() => open(service)}
        className={`${base} ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 md:hidden">
      <button
        type="button"
        onClick={() => open(service)}
        className={`${base} pointer-events-auto w-full shadow-[var(--mb-shadow-card)] ${className}`}
      >
        {children}
      </button>
    </div>
  );
}
