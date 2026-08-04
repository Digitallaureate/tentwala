import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

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
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-none">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(248,244,239,0.74))] shadow-[0_28px_80px_rgba(31,41,55,0.12)] ring-1 ring-[#dce5e5]/70 backdrop-blur-xl">
          <div className="flex flex-col gap-5 px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
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

              <div className="w-full lg:w-[20rem] xl:w-[24rem]">
                <SearchBar placeholder="Search decor, catering, venues..." />
              </div>

              <Link
                className={`inline-flex min-h-14 items-center justify-center rounded-full px-8 text-sm font-semibold uppercase tracking-[0.08em] shadow-[0_16px_30px_rgba(21,81,140,0.22)] transition sm:px-10 ${
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
        </div>
      </div>
    </header>
  );
}
