import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { Agentation } from "agentation";
import Navbar from "@/components/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "800"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    >
      <body
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "var(--novae-bg-main)", color: "var(--novae-text-primary)" }}
      >
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
