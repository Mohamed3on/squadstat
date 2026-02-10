import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-value",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "FormTracker - Football Form Analysis",
    template: "%s | FormTracker",
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
  openGraph: {
    title: "FormTracker - Football Form Analysis",
    description:
      "Track football team form, injuries, and player performance across Europe's top 5 leagues.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "FormTracker - Football Form Analysis",
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
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} antialiased bg-neutral-950 text-neutral-100 min-h-screen flex flex-col`}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
