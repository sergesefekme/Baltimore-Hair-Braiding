"use client";

import { createContext, useContext, useId } from "react";

type FieldContextValue = {
  id: string;
  describedBy?: string;
  invalid: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

type FieldProps = {
  /** Required. A placeholder is an example, never a label. */
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

/**
 * Wraps a control with its label, hint and error, and wires the ARIA
 * relationships through context so `Input` and `Select` need no props.
 */
export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  // Error supersedes hint as the description — announcing both is noise.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-eyebrow uppercase text-ink-muted">
          {label}
          {required && (
            <span className="text-accent" aria-hidden="true">
              {" *"}
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>

        {children}

        {error ? (
          <p id={errorId} className="text-caption text-error">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-caption text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

const CONTROL =
  "h-11 w-full rounded-sm border bg-surface-sunk px-3.5 text-body-sm text-ink transition-colors duration-150 ease-sweep placeholder:text-ink-muted";

function useField() {
  return useContext(FieldContext);
}

export function Input({ className = "", ...props }: React.ComponentProps<"input">) {
  const field = useField();
  return (
    <input
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={`${CONTROL} ${field?.invalid ? "border-error" : "border-line"} ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.ComponentProps<"select">) {
  const field = useField();
  return (
    <select
      id={field?.id}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
      className={`${CONTROL} ${field?.invalid ? "border-error" : "border-line"} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
