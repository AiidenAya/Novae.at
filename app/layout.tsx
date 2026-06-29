import type { Metadata } from "next";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Agentation } from "agentation";
import Navbar from "@/components/Navbar";
import { ThemeScript } from "@/components/ThemeScript";
import { LocaleProvider } from "@/lib/locale-context";
import "./globals.css";

const dmSans = localFont({
  src: [
    { path: "../public/fonts/dm-sans-normal-latin-ext.woff2", style: "normal", weight: "300 800" },
    { path: "../public/fonts/dm-sans-normal-latin.woff2",     style: "normal", weight: "300 800" },
    { path: "../public/fonts/dm-sans-italic-latin-ext.woff2", style: "italic", weight: "300 800" },
    { path: "../public/fonts/dm-sans-italic-latin.woff2",     style: "italic", weight: "300 800" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: [
    { path: "../public/fonts/space-grotesk-latin-ext.woff2", weight: "400 700" },
    { path: "../public/fonts/space-grotesk-latin.woff2",     weight: "400 700" },
  ],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novae",
  description: "Gérez et partagez vos personnages OC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "var(--novae-bg-main)", color: "var(--novae-text-primary)" }}
      >
        <ThemeScript />
        <LocaleProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </LocaleProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
        <SpeedInsights />
      </body>
    </html>
  );
}
