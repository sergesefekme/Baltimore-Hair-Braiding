type ContainerProps = React.ComponentProps<"div"> & {
  width?: "default" | "narrow" | "bleed";
};

const WIDTHS = {
  default: "mx-auto w-full max-w-[72rem] px-6",
  narrow: "mx-auto w-full max-w-[46rem] px-6",
  bleed: "w-full",
} as const;

export function Container({
  width = "default",
  className = "",
  ...props
}: ContainerProps) {
  return <div className={`${WIDTHS[width]} ${className}`} {...props} />;
}
