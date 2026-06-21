"use client";

import { useState, useTransition } from "react";

type RecentUser = {
  id: string; username: string | null; name: string | null;
  email: string; role: string; createdAt: string; inviteCode: string | null;
};

type InviteCode = {
  id: string; code: string; note: string | null;
  createdAt: string; expiresAt: string | null; usedAt: string | null;
  usedBy: { username: string | null } | null;
};

const cell: React.CSSProperties = {
  padding: "14px 20px",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-sm)",
  color: "var(--novae-text-primary)",
  borderBottom: "1px solid var(--novae-outline-all)",
};

const th: React.CSSProperties = {
  padding: "11px 20px",
  textAlign: "left",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-xs)",
  color: "var(--novae-text-secondary)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "1px solid var(--novae-outline-all)",
};

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: "var(--novae-radius-sm)",
      fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600,
      background: isAdmin ? "rgba(164,132,220,0.15)" : "rgba(136,136,136,0.1)",
      color: isAdmin ? "var(--novae-text-tag)" : "var(--novae-text-secondary)",
      border: `0.5px solid ${isAdmin ? "var(--novae-outline-tag)" : "var(--novae-outline-all)"}`,
    }}>
      {isAdmin && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z"/>
        </svg>
      )}
      {role}
    </span>
  );
}

function CodeStatusBadge({ code }: { code: InviteCode }) {
  if (code.usedAt) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(136,136,136,0.1)", color: "var(--novae-text-secondary)", border: "0.5px solid var(--novae-outline-all)" }}>
        Utilisé{code.usedBy?.username ? ` par @${code.usedBy.username}` : ""}
      </span>
    );
  }
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(220,53,69,0.1)", color: "#ff6b7a", border: "0.5px solid rgba(220,53,69,0.3)" }}>
        Expiré
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: "var(--novae-radius-sm)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, background: "rgba(72,199,142,0.12)", color: "#48c78e", border: "0.5px solid rgba(72,199,142,0.3)" }}>
      Disponible
    </span>
  );
}

export function AdminClient({ stats, recentUsers, initialCodes }: {
  stats: { totalUsers: number; totalCharacters: number; totalArtworks: number };
  recentUsers: RecentUser[];
  initialCodes: InviteCode[];
}) {
  const [codes, setCodes] = useState<InviteCode[]>(initialCodes);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const created = await res.json();
        setCodes((prev) => [created, ...prev]);
      }
    });
  }

  async function deleteCode(id: string) {
    setDeleting(id);
    await fetch("/api/admin/invite-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCodes((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  const card: React.CSSProperties = {
    background: "var(--novae-bg-card)",
    border: "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    overflow: "hidden",
  };

  return (
    <main style={{ width: "100%", padding: "40px 48px", fontFamily: "var(--font-dm-sans)", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--novae-text-tag)" stroke="none">
          <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z"/>
          <path d="M5 20h14" stroke="var(--novae-text-tag)" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
        {[
          { label: "Total users", value: stats.totalUsers },
          { label: "Personnages", value: stats.totalCharacters },
          { label: "Artworks", value: stats.totalArtworks },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...card, padding: "24px 28px", overflow: "visible" }}>
            <p style={{ fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Recent users — 2/3 */}
        <div style={{ ...card, overflowX: "auto" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--novae-outline-all)" }}>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>Utilisateurs récents</h2>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr>
                {["Username", "Email", "Rôle", "Code", "Rejoint"].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ ...cell, whiteSpace: "nowrap", fontWeight: 600 }}>{u.username ? `@${u.username}` : "—"}</td>
                  <td style={{ ...cell, color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)" }}>{u.email}</td>
                  <td style={cell}><RoleBadge role={u.role} /></td>
                  <td style={{ ...cell, fontFamily: "monospace", fontSize: "var(--novae-text-xs)", color: u.inviteCode ? "var(--novae-text-tag)" : "var(--novae-text-secondary)", whiteSpace: "nowrap" }}>
                    {u.inviteCode ?? "—"}
                  </td>
                  <td style={{ ...cell, color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-xs)", whiteSpace: "nowrap" }}>
                    {new Date(u.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sidebar codes — 1/3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Generate — une ligne */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, ...card, padding: "16px 20px" }}>
            <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0, whiteSpace: "nowrap" }}>
              Codes d'invitation
            </h2>
            <button
              onClick={generate}
              disabled={isPending}
              style={{
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                padding: "7px 14px", borderRadius: "var(--novae-radius-md)",
                backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)",
                border: "none", cursor: isPending ? "not-allowed" : "pointer",
                fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {isPending ? "…" : "Générer"}
            </button>
          </div>

          {/* Code list */}
          <div style={card}>
            {codes.length === 0 ? (
              <p style={{ padding: "20px", color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-sm)", margin: 0 }}>
                Aucun code généré.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Code", "Statut", ""].map((h, i) => <th key={i} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...cell, fontFamily: "monospace", fontWeight: 700, fontSize: "var(--novae-text-xs)", letterSpacing: "0.03em", color: "var(--novae-text-tag)", whiteSpace: "nowrap" }}>{c.code}</td>
                      <td style={cell}><CodeStatusBadge code={c} /></td>
                      <td style={{ ...cell, width: 70 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {!c.usedAt && (
                            <button
                              onClick={() => copy(c.code)}
                              title="Copier"
                              style={{ background: "none", border: "none", cursor: "pointer", color: copied === c.code ? "#48c78e" : "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center" }}
                            >
                              {copied === c.code ? (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              ) : (
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteCode(c.id)}
                            title="Supprimer"
                            disabled={deleting === c.id}
                            style={{ background: "none", border: "none", cursor: deleting === c.id ? "not-allowed" : "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: deleting === c.id ? 0.4 : 1 }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
