/**
 * The signature divider — five hairlines whose gaps widen downward, reading as
 * a scalp parting opening out. See docs/design/references/style-guide.md §4.
 *
 * Purely decorative, so it is hidden from assistive technology.
 */
export function Parting({
  size = "default",
  className = "",
}: {
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`${size === "sm" ? "parting-sm" : "parting"} ${className}`}
    />
  );
}
