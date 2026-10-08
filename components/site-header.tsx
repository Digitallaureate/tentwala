"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

type SiteHeaderProps = {
  active?: "home" | "about" | "services" | "gallery" | "book-now";
};

const navItems = [
  { href: "/", label: "Home", key: "home" },
  { href: "/about", label: "About us", key: "about" },
  { href: "/services", label: "Services", key: "services" },
  { href: "/gallery", label: "Gallery", key: "gallery" },
] as const;

export function SiteHeader({ active }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const activeKey =
    active ??
    (pathname === "/"
      ? "home"
      : pathname.startsWith("/about")
        ? "about"
        : pathname.startsWith("/services")
        ? "services"
        : pathname.startsWith("/gallery")
          ? "gallery"
          : pathname.startsWith("/contact")
            ? "book-now"
            : undefined);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-88">
      <div className="w-full">
        <div className="overflow-hidden border border-black/5 bg-transparent shadow-none sm:bg-[var(--background)] sm:shadow-[0_14px_44px_rgba(0,0,0,0.08)]">
          <div className="mx-auto w-full px-4 py-3 sm:px-6 lg:px-[clamp(24px,6.25vw,120px)]">
            <div className="flex items-center justify-between gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-[clamp(16px,1.67vw,32px)]">
              <Link
                className="brand-logo min-w-0 shrink-0 font-serif uppercase text-black lg:justify-self-start"
                href="/"
                onClick={closeMenu}
              >
                TENT<span className="text-[var(--color-gold)]">WALA</span>
              </Link>

              <nav className="hidden items-center gap-[clamp(16px,1.67vw,32px)] justify-self-center text-[clamp(15px,1.46vw,28px)] font-Regular text-black lg:flex">
                {navItems.map((item) => {
                  const isActive = activeKey === item.key;

                  return (
                    <Link
                      key={item.key}
                      className={`transition ${
                        isActive
                          ? "font-semibold text-[var(--color-primary)]"
                          : "hover:text-[var(--color-primary)]"
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden min-w-0 items-center justify-end gap-3 justify-self-end lg:flex">
                <div className="h-[48px] w-[clamp(150px,13vw,250px)] shrink-0">
                  <SearchBar placeholder="Services, ..." compact />
                </div>

                <Link
                  className={`inline-flex h-[48px] w-[clamp(110px,9.3vw,178px)] shrink-0 items-center justify-center rounded-[40px] text-sm font-medium text-white shadow-[0_10px_22px_rgba(184,92,56,0.22)] transition ${
                    activeKey === "book-now"
                      ? "bg-[var(--color-primary)]"
                      : "bg-[var(--color-primary)] hover:bg-[#9f4e2f]"
                  }`}
                  href="/contact"
                >
                  Get a Quote
                </Link>
              </div>

              <button
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_10px_24px_rgba(0,0,0,0.08)] transition hover:bg-[var(--color-bg)] lg:hidden"
                onClick={() => setIsMenuOpen((current) => !current)}
                type="button"
              >
                <span className="relative block h-4 w-5">
                  <span
                    className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-current transition ${
                      isMenuOpen ? "translate-y-[7px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-current transition ${
                      isMenuOpen ? "opacity-0" : ""
                    }`}
                  />
                  <span
                    className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-current transition ${
                      isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""
                    }`}
                  />
                </span>
              </button>
            </div>

            <div
              className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-300 lg:hidden ${
                isMenuOpen ? "mt-5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <div className="space-y-4 border-t border-black/10 pt-4">
                  <nav className="grid gap-2">
                    {navItems.map((item) => {
                      const isActive = activeKey === item.key;

                      return (
                        <Link
                          key={item.key}
                          className={`rounded-2xl px-4 py-3 text-base transition ${
                            isActive
                              ? "bg-[var(--color-gold-pale)] font-semibold text-[var(--color-primary)]"
                              : "text-black hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]"
                          }`}
                          href={item.href}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="border border-black/10 bg-[var(--color-bg)] p-2">
                    <SearchBar placeholder="Search services..." compact />
                  </div>

                  <Link
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(184,92,56,0.18)] transition ${
                      activeKey === "book-now"
                        ? "bg-[var(--color-primary)]"
                        : "bg-[var(--color-primary)] hover:bg-[#9f4e2f]"
                    }`}
                    href="/contact"
                    onClick={closeMenu}
                  >
                    Get a Quote
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
