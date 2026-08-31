"use client";

import { useState } from "react";
import Image from "next/image";
import { useT } from "@/lib/locale-context";

// ── Feature icons ─────────────────────────────────────────────────────────────

function IconRelations() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/>
      <path d="M8.6 7.4L11 15.5M15.4 7.4L13 15.5M9 6h6"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
    </svg>
  );
}

function IconWorld() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z"/>
    </svg>
  );
}

function IconFriends() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconExport() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function IconHuman() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><line x1="5.5" y1="18.5" x2="18.5" y2="5.5"/>
    </svg>
  );
}

const FEATURES = [
  { icon: IconRelations, title: "landingFeatRelationsTitle", desc: "landingFeatRelationsDesc" },
  { icon: IconClock,     title: "landingFeatTimelinesTitle", desc: "landingFeatTimelinesDesc" },
  { icon: IconWorld,     title: "landingFeatWorldsTitle",    desc: "landingFeatWorldsDesc" },
  { icon: IconFriends,   title: "landingFeatFriendsTitle",   desc: "landingFeatFriendsDesc" },
  { icon: IconExport,    title: "landingFeatExportTitle",    desc: "landingFeatExportDesc" },
  { icon: IconHuman,     title: "landingFeatHumanTitle",     desc: "landingFeatHumanDesc" },
] as const;

// ── Waitlist form ─────────────────────────────────────────────────────────────

function WaitlistForm({ buttonLabel, wide = false }: { buttonLabel: string; wide?: boolean }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.landingWaitlistInvalidEmail);
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setError(t.landingWaitlistError);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-link)", fontWeight: 600 }}>
        {t.landingWaitlistSuccess}
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: wide ? "100%" : 480 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.landingEmailPlaceholder}
          style={{
            flex: "1 1 260px",
            padding: "13px 16px",
            borderRadius: "var(--novae-radius-md)",
            border: "1px solid var(--novae-outline-all)",
            background: "var(--novae-bg-input)",
            color: "var(--novae-text-primary)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-base)",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          style={{
            padding: "13px 24px",
            borderRadius: "var(--novae-radius-md)",
            border: "none",
            backgroundColor: "var(--novae-btn-primary)",
            color: "var(--novae-text-btn)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-base)",
            fontWeight: 600,
            cursor: status === "sending" ? "not-allowed" : "pointer",
            opacity: status === "sending" ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {status === "sending" ? t.sending : buttonLabel}
        </button>
      </form>
      <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: error ? "#ff6b7a" : "var(--novae-text-secondary)" }}>
        {error ?? t.landingWaitlistNote}
      </p>
    </div>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function PillarCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      style={{
        background: "var(--novae-bg-card)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-lg)",
        padding: "24px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: () => React.ReactElement; title: string; desc: string }) {
  return (
    <div
      style={{
        background: "var(--novae-bg-card)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-lg)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ color: "var(--novae-text-link)" }}><Icon /></div>
      <h4 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
        {title}
      </h4>
      <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

export default function LandingPage() {
  const { t } = useT();

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative gradient blobs */}
      <div style={{ position: "absolute", top: -200, left: -300, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(105,61,169,0.35), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: 600, right: -300, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(105,61,169,0.3), transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "64px 24px 0", display: "flex", flexDirection: "column", gap: 96 }}>

        {/* ── Hero ── */}
        <section style={{ display: "flex", flexWrap: "wrap", gap: 48, alignItems: "center" }}>
          <div style={{ flex: "1 1 480px", display: "flex", flexDirection: "column", gap: 28, maxWidth: 620 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: "var(--novae-text-primary)", lineHeight: 1.2 }}>
              {t.landingHeroTitle}
            </h1>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)", lineHeight: 1.6 }}>
              {t.landingHeroSubtitle}
            </p>
            <WaitlistForm buttonLabel={t.landingJoinWaitlist} />
          </div>

          <div style={{ flex: "1 1 420px", display: "flex", justifyContent: "center" }}>
            <Image
              src="/landing/hero-mockup.png"
              alt="Novae app preview"
              width={1691}
              height={1214}
              priority
              style={{ width: "100%", maxWidth: 620, height: "auto" }}
            />
          </div>
        </section>

        {/* ── Designed for creativity ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h2 style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            {t.landingDesignedTitle}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PillarCard title={t.landingAccessibleTitle} desc={t.landingAccessibleDesc} />
            <PillarCard title={t.landingFairTitle} desc={t.landingFairDesc} />
            <PillarCard title={t.landingKindnessTitle} desc={t.landingKindnessDesc} />
          </div>
        </section>

        {/* ── Coming soon features ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              {t.landingComingSoonTitle}
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)" }}>
              {t.landingComingSoonSubtitle}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={t[f.title]} desc={t[f.desc]} />
            ))}
          </div>
        </section>

        {/* ── Second CTA ── */}
        <section
          style={{
            background: "var(--novae-bg-card)",
            border: "1px solid var(--novae-outline-all)",
            borderRadius: "var(--novae-radius-lg)",
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              {t.landingCta2Title}
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", lineHeight: 1.6, maxWidth: 900 }}>
              {t.landingCta2Desc}
            </p>
          </div>
          <WaitlistForm buttonLabel={t.landingReserveSpot} wide />
        </section>
      </div>
    </div>
  );
}
