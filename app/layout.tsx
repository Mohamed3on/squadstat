import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toaster } from "@/components/ui/sonner";
import { absoluteUrl, getSiteOrigin } from "@/lib/site-config";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "SquadStat - Football Form Analysis",
    template: "%s | SquadStat",
  },
  description:
    "Track football team form, injuries, and player performance across Europe's top 5 leagues. Analyze Premier League, La Liga, Bundesliga, Serie A, and Ligue 1 with real-time data from Transfermarkt.",
  keywords: [
    "football analytics",
    "soccer statistics",
    "team form",
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
    "Transfermarkt",
    "football injuries",
    "player stats",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SquadStat - Football Form Analysis",
    description:
      "Track football team form, injuries, and player performance across Europe's top 5 leagues.",
    type: "website",
    locale: "en_US",
    url: absoluteUrl("/"),
  },
  twitter: {
    card: "summary",
    title: "SquadStat - Football Form Analysis",
    description:
      "Track football team form, injuries, and player performance across Europe's top 5 leagues.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} antialiased bg-neutral-950 text-neutral-100 min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="page-container flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
