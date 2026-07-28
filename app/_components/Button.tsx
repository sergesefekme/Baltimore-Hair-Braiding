type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary:
    "border border-line-strong text-ink bg-transparent hover:bg-surface-warm",
  ghost: "text-accent hover:bg-accent-soft",
};

/**
 * `sm` is 36px and therefore DESKTOP ONLY — below the 44px tap target.
 * Do not reach for it in a layout a phone can reach.
 */
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-body-sm",
  md: "h-11 px-5 text-body-sm",
  lg: "h-13 px-7 text-body",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // Label stays in the DOM while loading so the button keeps its width and
      // nothing around it shifts.
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2 rounded-md transition-colors duration-150 ease-sweep disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      <span className={loading ? "invisible" : undefined}>{children}</span>
      {loading && (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center"
        >
          <span className="size-4 animate-spin rounded-pill border-2 border-current border-t-transparent motion-reduce:animate-none" />
        </span>
      )}
    </button>
  );
}
