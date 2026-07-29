import Link from "next/link";

type SiteHeaderProps = {
  active?: "home" | "services" | "gallery" | "book-now";
};

const navItems = [
  { href: "/", label: "Home", key: "home" },
  { href: "/services", label: "Services", key: "services" },
  { href: "/gallery", label: "Gallery", key: "gallery" },
] as const;

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="border border-[#dfe9e7] bg-white/75 px-5 py-4 shadow-[0_12px_35px_rgba(40,50,64,0.06)] backdrop-blur sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <Link className="block" href="/">
          <div className="space-y-1">
            <p className="font-serif text-4xl uppercase tracking-[0.08em] text-[#183153] sm:text-5xl">
              TentWala
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#56b7c4] sm:text-sm">
              Crafted Event Experiences
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
          <nav className="flex flex-wrap items-center gap-5 text-base text-[#1d2d44] sm:gap-8 sm:text-lg">
            {navItems.map((item) => {
              const isActive = active === item.key;

              return (
                <Link
                  key={item.key}
                  className={`transition ${
                    isActive
                      ? "font-semibold text-[#0f59c7]"
                      : "hover:text-[#0f59c7]"
                  }`}
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            className={`inline-flex min-h-14 items-center justify-center rounded-full px-8 text-sm font-semibold uppercase tracking-[0.08em] transition sm:px-10 ${
              active === "book-now"
                ? "bg-[#0f4f8b] text-white"
                : "bg-[#15518c] text-white hover:bg-[#0f4f8b]"
            }`}
            href="/contact"
          >
            Book Now
          </Link>
        </div>
      </div>
    </header>
  );
}
