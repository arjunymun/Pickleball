interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
  invert?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  invert = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  const eyebrowClass = invert ? "section-eyebrow !text-white/55" : "section-eyebrow";
  const titleClass = invert ? "text-white" : "text-[var(--ink-strong)]";
  const descriptionClass = invert ? "text-white/70" : "text-[var(--ink-soft)]";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className={eyebrowClass}>{eyebrow}</p>
      <h2 className={`mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl ${titleClass}`}>
        {title}
      </h2>
      <p className={`mt-5 text-base leading-8 sm:text-lg ${descriptionClass}`}>{description}</p>
    </div>
  );
}
