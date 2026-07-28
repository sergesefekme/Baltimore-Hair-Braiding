import Image from "next/image";

type PortraitFrameProps = {
  src: string;
  /** Required. Name the style — "Knotless box braids, mid-back length". */
  alt: string;
  /**
   * Which corner carries the sweep. It must run WITH the hair: a subject
   * facing right gets `sweep="left"`. Backwards, it fights the photograph.
   */
  sweep?: "left" | "right";
  /** Hero image only; everything else lazy-loads. */
  priority?: boolean;
  sizes?: string;
  /** 4/5 on its own, 3/4 in a grid. Never square. */
  ratio?: "4/5" | "3/4";
  caption?: string;
  className?: string;
};

const RATIOS = {
  "4/5": "aspect-[4/5]",
  "3/4": "aspect-[3/4]",
} as const;

export function PortraitFrame({
  src,
  alt,
  sweep = "left",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  ratio = "4/5",
  caption,
  className = "",
}: PortraitFrameProps) {
  return (
    <figure className={className}>
      {/* The hairline matters more than it looks: several of the studio photos
          have warm, pale backdrops that sit within ~2.7:1 of the page ground,
          so without an edge the image dissolves into the page. A ring rather
          than a border, so it does not affect layout or the sweep radius. */}
      <div
        className={`relative ${RATIOS[ratio]} ${sweep === "right" ? "sweep-r" : "sweep"} bg-surface-warm ring-1 ring-line`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-caption text-ink-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
