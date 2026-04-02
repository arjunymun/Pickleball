interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--ink-strong)] sm:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[var(--ink-soft)] sm:text-lg">{description}</p>
    </div>
  );
}
