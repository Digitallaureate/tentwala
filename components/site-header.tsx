"use client";

import { useState } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-none">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.82),rgba(248,244,239,0.74))] shadow-[0_28px_80px_rgba(31,41,55,0.12)] ring-1 ring-[#dce5e5]/70 backdrop-blur-xl">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <Link className="min-w-0 flex-1" href="/" onClick={closeMenu}>
                <div className="space-y-1">
                  <p className="truncate font-serif text-[2.15rem] uppercase tracking-[0.08em] text-[#183153] sm:text-[2.8rem] lg:text-5xl">
                    TentWala
                  </p>
                  <p className="max-w-[12rem] text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-[#56b7c4] sm:max-w-none sm:text-sm">
                    Crafted Event Experiences
                  </p>
                </div>
              </Link>

              <div className="hidden min-w-0 flex-1 items-center justify-end gap-4 lg:flex xl:gap-6">
                <nav className="flex items-center gap-5 text-base text-[#1d2d44] xl:gap-8 xl:text-lg">
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

                <div className="w-full max-w-[22rem] xl:max-w-[24rem]">
                  <SearchBar placeholder="Search decor, catering, venues..." />
                </div>

                <Link
                  className={`inline-flex min-h-14 shrink-0 items-center justify-center rounded-full px-7 text-sm font-semibold uppercase tracking-[0.08em] shadow-[0_16px_30px_rgba(21,81,140,0.22)] transition xl:px-10 ${
                    active === "book-now"
                      ? "bg-[#0f4f8b] text-white"
                      : "bg-[#15518c] text-white hover:bg-[#0f4f8b]"
                  }`}
                  href="/contact"
                >
                  Book Now
                </Link>
              </div>

              <button
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#1d2d44]/10 bg-white/80 text-[#183153] shadow-[0_10px_24px_rgba(29,45,68,0.08)] transition hover:bg-white lg:hidden"
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
                <div className="space-y-4 border-t border-[#1d2d44]/8 pt-4">
                  <nav className="grid gap-2">
                    {navItems.map((item) => {
                      const isActive = active === item.key;

                      return (
                        <Link
                          key={item.key}
                          className={`rounded-2xl px-4 py-3 text-base transition ${
                            isActive
                              ? "bg-[#eef4fb] font-semibold text-[#0f59c7]"
                              : "text-[#1d2d44] hover:bg-white/70 hover:text-[#0f59c7]"
                          }`}
                          href={item.href}
                          onClick={closeMenu}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="rounded-[1.5rem] border border-[#1d2d44]/8 bg-white/55 p-2">
                    <SearchBar placeholder="Search decor, catering, venues..." />
                  </div>

                  <Link
                    className={`inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold uppercase tracking-[0.08em] shadow-[0_16px_30px_rgba(21,81,140,0.18)] transition ${
                      active === "book-now"
                        ? "bg-[#0f4f8b] text-white"
                        : "bg-[#15518c] text-white hover:bg-[#0f4f8b]"
                    }`}
                    href="/contact"
                    onClick={closeMenu}
                  >
                    Book Now
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
