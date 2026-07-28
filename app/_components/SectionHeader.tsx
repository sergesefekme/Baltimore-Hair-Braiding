type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Centring is rare by design — the references are all off-centre. */
  align?: "start" | "center";
  /** Heading level. Defaults to h2; use h1 for a page title. */
  as?: "h1" | "h2";
  id?: string;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = "start",
  as: Heading = "h2",
  id,
  className = "",
}: SectionHeaderProps) {
  return (
    <header
      className={`${align === "center" ? "mx-auto text-center" : ""} max-w-[46rem] ${className}`}
    >
      {eyebrow && (
        <p className="text-eyebrow uppercase text-accent">{eyebrow}</p>
      )}
      <Heading
        id={id}
        className={`${eyebrow ? "mt-3" : ""} ${Heading === "h1" ? "text-h1" : "text-h2"} font-display text-ink`}
      >
        {title}
      </Heading>
      {lead && (
        <p className="mt-5 max-w-[52ch] text-lead text-ink-muted">{lead}</p>
      )}
    </header>
  );
}
