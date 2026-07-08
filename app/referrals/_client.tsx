"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { thumbUrl } from "@/lib/thumb";
import { useT } from "@/lib/locale-context";

export type ReferralCode = {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  usedBy: { username: string | null; avatar: string | null } | null;
};

function codeStatus(code: ReferralCode): "used" | "expired" | "available" {
  if (code.usedAt) return "used";
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) return "expired";
  return "available";
}

function StatusBadge({ code, labels }: { code: ReferralCode; labels: { available: string; used: string; expired: string } }) {
  const s = codeStatus(code);
  const styles: Record<typeof s, React.CSSProperties> = {
    used:      { background: "rgba(136,136,136,0.1)",  color: "var(--novae-text-secondary)", border: "0.5px solid var(--novae-outline-all)" },
    expired:   { background: "rgba(220,53,69,0.1)",    color: "#ff6b7a",                     border: "0.5px solid rgba(220,53,69,0.3)" },
    available: { background: "rgba(72,199,142,0.12)",  color: "#48c78e",                     border: "0.5px solid rgba(72,199,142,0.3)" },
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, whiteSpace: "nowrap", ...styles[s] }}>
      {labels[s]}
    </span>
  );
}

export function ReferralsClient({ initialCodes, max }: { initialCodes: ReferralCode[]; max: number }) {
  const { t, locale } = useT();
  const [codes, setCodes] = useState<ReferralCode[]>(initialCodes);
  const [copied, setCopied] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const limitReached = codes.length >= max;

  function generate() {
    startTransition(async () => {
      const res = await fetch("/api/referrals", { method: "POST" });
      if (res.ok) {
        const created = await res.json();
        setCodes((prev) => [created, ...prev]);
      }
    });
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  const referred = codes.filter((c) => c.usedBy);

  const card: React.CSSProperties = {
    background: "var(--novae-bg-card)",
    border: "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    overflow: "hidden",
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "var(--font-space-grotesk)",
    fontSize: "var(--novae-text-lg)",
    fontWeight: 700,
    color: "var(--novae-text-primary)",
    margin: 0,
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ width: "100%", padding: "40px 48px 80px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            {t.referralTitle}
          </h1>
          <p style={{ margin: "6px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
            {t.referralSubtitle}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={isPending || limitReached}
          style={{
            display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            padding: "10px 18px", borderRadius: "var(--novae-radius-md)",
            backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)",
            border: "none", cursor: isPending || limitReached ? "not-allowed" : "pointer",
            fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600,
            opacity: isPending || limitReached ? 0.5 : 1,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {isPending ? "…" : t.referralGenerate}
        </button>
      </div>

      {/* My codes + My referrals side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

      {/* My codes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 style={sectionTitle}>{t.referralMyCodes}</h2>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: limitReached ? "var(--novae-text-tag)" : "var(--novae-text-secondary)", fontWeight: 600 }}>
            {t.referralCodesUsed.replace("{used}", String(codes.length)).replace("{max}", String(max))}
          </span>
        </div>
        <div style={card}>
          {codes.length === 0 ? (
            <p style={{ padding: 20, margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {t.referralEmpty}
            </p>
          ) : (
            codes.map((c, i) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < codes.length - 1 ? "1px solid var(--novae-outline-all)" : "none" }}>
                <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "var(--novae-text-sm)", letterSpacing: "0.03em", color: "var(--novae-text-tag)", whiteSpace: "nowrap" }}>
                  {c.code}
                </span>
                <span style={{ flex: 1 }} />
                <StatusBadge code={c} labels={{ available: t.referralStatusAvailable, used: t.referralStatusUsed, expired: t.referralStatusExpired }} />
                {!c.usedAt && (
                  <button
                    onClick={() => copy(c.code)}
                    title={c.code}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copied === c.code ? "#48c78e" : "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center" }}
                  >
                    {copied === c.code
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    }
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* My referrals */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={sectionTitle}>{t.referralMyReferrals}</h2>
        <div style={card}>
          {referred.length === 0 ? (
            <p style={{ padding: 20, margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {t.referralNoReferrals}
            </p>
          ) : (
            referred.map((c, i) => {
              const u = c.usedBy!;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: i < referred.length - 1 ? "1px solid var(--novae-outline-all)" : "none" }}>
                  {u.avatar ? (
                    <img src={thumbUrl(u.avatar, 80) ?? u.avatar} alt={u.username ?? ""} loading="lazy" decoding="async" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600 }}>
                      {(u.username ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    {u.username ? (
                      <Link href={`/${u.username}`} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)", textDecoration: "none" }}>
                        @{u.username}
                      </Link>
                    ) : (
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>—</span>
                    )}
                    {c.usedAt && (
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                        {t.referralUsedOn.replace("{date}", fmtDate(c.usedAt))}
                      </span>
                    )}
                  </div>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontFamily: "monospace", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", whiteSpace: "nowrap" }}>
                    {c.code}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      </div>
    </div>
  );
}
