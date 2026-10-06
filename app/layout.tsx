import type { Metadata } from "next";
import { Afacad, Judson } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const afacad = Afacad({
  subsets: ["latin"],
  variable: "--font-afacad",
  display: "swap",
});

const judson = Judson({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-judson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TentWala | Event Planning Platform",
  description:
    "TentWala brings venues, decor, catering, and event execution together for polished celebrations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${afacad.variable} ${judson.variable}`}>
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
