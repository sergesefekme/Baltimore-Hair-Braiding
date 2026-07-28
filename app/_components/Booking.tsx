"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  useTransition,
} from "react";
import { submitBooking } from "../_lib/booking-action";
import {
  type BookingErrors,
  type BookingInput,
  EMPTY_BOOKING,
  validateBooking,
} from "../_lib/booking";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "../_lib/studio";
import { Button } from "./Button";
import { Field, Input, Select } from "./Field";
import { Parting } from "./Parting";

type BookingContextValue = {
  /** Opens the dialog, optionally pre-selecting a style. */
  open: (style?: string) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error("useBooking must be used inside <BookingProvider>");
  }
  return ctx;
}

/** What the dialog is showing: the form, or the outcome of a submission. */
type Outcome = null | "sent" | "unreachable";

export function BookingProvider({
  styles,
  children,
}: {
  styles: string[];
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<BookingInput>(EMPTY_BOOKING);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [pending, startTransition] = useTransition();

  // Empty on the server, so hydration matches. Filled when the form opens
  // rather than at mount — "today" should mean the moment someone starts
  // filling it in, not whenever the page happened to load.
  const [today, setToday] = useState("");

  const open = useCallback((style?: string) => {
    setToday(new Date().toISOString().slice(0, 10));
    setValues({ ...EMPTY_BOOKING, style: style ?? "" });
    setErrors({});
    setOutcome(null);
    dialogRef.current?.showModal();
    // showModal() makes the background inert but does NOT stop it scrolling,
    // which on a phone means the page slides around behind the form.
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  const set =
    (key: keyof BookingInput) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues((prev) => ({ ...prev, [key]: event.target.value }));

  function focusFirstError(found: BookingErrors) {
    const first = Object.keys(found)[0];
    document.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Checked here for instant feedback, and again on the server where it
    // actually counts — a Server Action is a public endpoint.
    const found = validateBooking(values, today);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    startTransition(async () => {
      const result = await submitBooking(values);

      if (result.status === "invalid") {
        setErrors(result.errors);
        focusFirstError(result.errors);
        return;
      }

      // "unconfigured" and "failed" are the same story to the person filling
      // the form in: it did not get through, so call instead. The distinction
      // is in the server log, which is where it is useful.
      setOutcome(result.status === "sent" ? "sent" : "unreachable");
    });
  }

  return (
    <BookingContext.Provider value={{ open }}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="booking-title"
        // Fires for every close path — the buttons, Escape, and the backdrop.
        onClose={() => {
          document.body.style.overflow = "";
          setOutcome(null);
        }}
        className="w-[min(34rem,calc(100vw-2rem))] rounded-md border border-line bg-surface p-0 text-ink shadow-[var(--mb-shadow-card)]"
      >
        <div className="p-6 sm:p-8">
          {outcome === "sent" ? (
            <div>
              <h2 id="booking-title" className="text-h3 font-display text-ink">
                Request sent
              </h2>
              <p className="mt-4 text-body-sm text-ink-muted">
                Simi will check the slot is free and come back to you by phone
                or email within a day. Nothing is booked until then.
              </p>
              <Parting className="my-6" />
              <p className="text-caption text-ink-muted">
                Once she has confirmed, she will send you a link to pay the
                deposit. We do not take any money before the appointment is
                agreed.
              </p>
              <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={close}>
                  Done
                </Button>
              </div>
            </div>
          ) : outcome === "unreachable" ? (
            <div>
              <h2 id="booking-title" className="text-h3 font-display text-ink">
                That did not get through
              </h2>
              <p className="mt-4 text-body-sm text-ink-muted">
                Something went wrong at our end, so your request was not
                delivered. Call the studio and we will book you in directly.
              </p>
              <p className="mt-4">
                <a
                  href={STUDIO_PHONE_HREF}
                  data-numeric=""
                  className="inline-flex min-h-11 items-center text-h4 font-display text-accent underline underline-offset-4"
                >
                  {STUDIO_PHONE}
                </a>
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="ghost" onClick={close}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOutcome(null)}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h2 id="booking-title" className="text-h3 font-display text-ink">
                Book an appointment
              </h2>
              <p className="mt-3 text-body-sm text-ink-muted">
                Tell us what you would like and when. We will confirm the exact
                price and timing before anything is booked.
              </p>

              <div className="mt-6 flex flex-col gap-5">
                <Field label="Name" required error={errors.name}>
                  <Input
                    data-field="name"
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    onChange={set("name")}
                  />
                </Field>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Phone" required error={errors.phone}>
                    <Input
                      data-field="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="07700 900123"
                      value={values.phone}
                      onChange={set("phone")}
                    />
                  </Field>

                  <Field label="Email" required error={errors.email}>
                    <Input
                      data-field="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={values.email}
                      onChange={set("email")}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Preferred date" required error={errors.date}>
                    <Input
                      data-field="date"
                      name="date"
                      type="date"
                      min={today || undefined}
                      value={values.date}
                      onChange={set("date")}
                    />
                  </Field>

                  <Field label="Preferred time" required error={errors.time}>
                    <Input
                      data-field="time"
                      name="time"
                      type="time"
                      value={values.time}
                      onChange={set("time")}
                    />
                  </Field>
                </div>

                <Field
                  label="Style"
                  hint="Not sure yet? Leave it and we will talk it through."
                >
                  <Select
                    data-field="style"
                    name="style"
                    value={values.style}
                    onChange={set("style")}
                  >
                    <option value="">No preference yet</option>
                    {styles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={pending}>
                  Request appointment
                </Button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </BookingContext.Provider>
  );
}
