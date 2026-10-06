type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  // Extra classes for the gold rule, e.g. "lg:hidden" to hide it on desktop.
  ruleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  ruleClassName = "",
}: SectionHeadingProps) {
  return (
    <div className="text-center">
      <p className="text-base font-medium text-[var(--color-gold)] lg:text-[38px] lg:font-normal lg:leading-[40px]">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-4xl text-black sm:text-5xl lg:mt-0 lg:text-[58px] lg:leading-[80px]">
        {title}
      </h2>
      <div
        className={`mx-auto mt-3 h-px w-20 bg-[var(--color-gold)] lg:mt-0 lg:h-[2px] lg:w-[150px] ${ruleClassName}`}
      />
    </div>
  );
}
