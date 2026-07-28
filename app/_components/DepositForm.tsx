"use client";

import { useState, useTransition } from "react";
import { startDeposit } from "../_lib/deposit-action";
import { STUDIO_PHONE, STUDIO_PHONE_HREF } from "../_lib/studio";
import { Button } from "./Button";
import { Field, Input } from "./Field";

type DepositFormProps = {
  /** Prefilled from the link Simi sends; the payer can correct any of it. */
  defaultName: string;
  defaultEmail: string;
  defaultReference: string;
  deposit: string;
};

export function DepositForm({
  defaultName,
  defaultEmail,
  defaultReference,
  deposit,
}: DepositFormProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await startDeposit({
        name,
        email,
        reference: defaultReference,
      });

      if (result.status === "created") {
        window.location.assign(result.url);
        return;
      }

      setError(
        result.status === "invalid"
          ? result.message
          : "We could not start the payment just now. Call the studio and we will take it over the phone.",
      );
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col gap-5">
      <Field label="Name the booking is under" required>
        <Input
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>

      <Field label="Email" required hint="Your receipt goes here.">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      {error && (
        <div
          role="alert"
          className="rounded-md border-l-[3px] border-error bg-surface p-4"
        >
          <p className="text-body-sm text-error">Payment not started</p>
          <p className="mt-1 text-caption text-ink-muted">{error}</p>
          <p className="mt-2">
            <a
              href={STUDIO_PHONE_HREF}
              data-numeric=""
              className="inline-flex min-h-11 items-center text-body-sm text-accent underline underline-offset-4"
            >
              {STUDIO_PHONE}
            </a>
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-ink-muted">
          Card payment handled by Stripe. We never see your card details.
        </p>
        <Button type="submit" variant="primary" size="lg" loading={pending}>
          Pay {deposit} deposit
        </Button>
      </div>
    </form>
  );
}
