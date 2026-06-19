"use client";

import { useT } from "@/lib/locale-context";

export default function Home() {
  const { t } = useT();
  return (
    <div className="flex flex-1 items-center justify-center" style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span style={{ fontSize: 32, color: "var(--novae-btn-primary)" }}>✦</span>
        <p style={{ fontSize: "var(--novae-text-lg)" }}>{t.homeComingSoon}</p>
      </div>
    </div>
  );
}
