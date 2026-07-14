"use client";

import { useState, useEffect } from "react";
import { thumbUrl } from "@/lib/thumb";
import { Card, IconHeart } from "../_shared";
import type { Artwork, ArtworkCredit } from "../_mock-data";
import SensitiveImageWrapper, { SensitiveBadge } from "@/components/SensitiveImageWrapper";
import { ArtworkCreditsDisplay } from "@/components/ui/ArtworkCreditsDisplay";
import { ArtworkCreditsEditor, creditsValid, emptyCredit, type CreditDraft } from "@/components/ui/ArtworkCreditsEditor";
import { useT } from "@/lib/locale-context";

type LightboxEntry = { url: string; credits: ArtworkCredit[]; characters: Artwork["characters"] };
type CharStub = { id: string; name: string; numId: number; slug: string };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--novae-bg-main)",
  border: "1px solid var(--novae-outline-all)",
  borderRadius: "var(--novae-radius-md)",
  color: "var(--novae-text-primary)",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-sm)",
  outline: "none",
  boxSizing: "border-box",
};

function Lightbox({ entry, onClose }: { entry: LightboxEntry; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "var(--novae-bg-card)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, cursor: "zoom-out" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: "var(--novae-radius-lg)", objectFit: "contain", cursor: "default" }}
      />
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {entry.characters.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {entry.characters.map((c) => (
              <a
                key={c.numId}
                href={`/library/characters/${c.numId}-${c.slug}`}
                style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--novae-radius-sm)", padding: "4px 10px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "#fff", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {c.name}
              </a>
            ))}
          </div>
        )}
        {entry.credits.length > 0 && (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Art by <ArtworkCreditsDisplay credits={entry.credits} linkStyle={{ color: "var(--novae-text-link)" }} />
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{ position: "fixed", top: 24, right: 24, width: 40, height: 40, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >×</button>
    </div>
  );
}

function ArtworkCard({
  artwork, onClick, isOwner, onDelete, onEdit,
}: {
  artwork: Artwork;
  onClick: () => void;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onEdit: (artwork: Artwork) => void;
}) {
  return (
    <div style={{ display: "block", marginBottom: 16, breakInside: "avoid" }}>
      <div
        onClick={onClick}
        style={{ width: "100%", borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)", position: "relative", cursor: "zoom-in" }}
        className="artwork-card-wrap"
      >
        <SensitiveImageWrapper sensitiveType={artwork.sensitiveType ?? null}>
          {artwork.thumbnailUrl
            ? <img src={thumbUrl(artwork.thumbnailUrl, 400) ?? artwork.thumbnailUrl} alt="" loading="lazy" decoding="async" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block", pointerEvents: "none" }} />
            : artwork.image
              ? <img src={thumbUrl(artwork.image, 640) ?? artwork.image} alt="" loading="lazy" decoding="async" style={{ width: "100%", display: "block", pointerEvents: "none" }} />
              : <div style={{ width: "100%", aspectRatio: artwork.aspectRatio ?? "1/1", background: artwork.fill ?? "rgba(105,61,169,0.15)" }} />
          }
        </SensitiveImageWrapper>
        <SensitiveBadge sensitiveType={artwork.sensitiveType ?? null} />
        {artwork.characters.length > 0 && (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {artwork.characters.map((c) => (
              <a
                key={c.numId}
                href={`/library/characters/${c.numId}-${c.slug}`}
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: "rgba(15,18,28,0.75)", backdropFilter: "blur(4px)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 8px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {c.name}
              </a>
            ))}
          </div>
        )}
        {isOwner && (
          <div className="artwork-card-actions" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(artwork); }}
              style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Edit credits"
            >
              <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(String(artwork.id)); }}
              style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Delete"
            >×</button>
          </div>
        )}
      </div>
    </div>
  );
}

function isMineArtwork(credits: ArtworkCredit[] | undefined, profileUserId: string | null) {
  if (!profileUserId) return true;
  return (credits ?? []).some((c) => c.userId === profileUserId);
}

export default function ArtworksTab({
  artworks: initial, isOwner = false, username = "", profileUserId = null,
}: {
  artworks: Artwork[];
  isOwner?: boolean;
  username?: string;
  profileUserId?: string | null;
}) {
  const { t } = useT();
  const [artworks, setArtworks] = useState(initial);
  const [filter, setFilter] = useState<"mine" | "all">("mine");
  const [lightbox, setLightbox] = useState<LightboxEntry | null>(null);

  const visibleArtworks = filter === "mine"
    ? artworks.filter((a) => isMineArtwork(a.credits, profileUserId))
    : artworks;

  // Edit credits modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creditsDrafts, setCreditsDrafts] = useState<CreditDraft[]>([emptyCredit()]);
  const [creditsCharacters, setCreditsCharacters] = useState<CharStub[]>([]);
  const [creditsCharSearch, setCreditsCharSearch] = useState("");
  const [creditsCharResults, setCreditsCharResults] = useState<CharStub[]>([]);
  const [creditsCharLoading, setCreditsCharLoading] = useState(false);
  const [creditsSensitiveType, setCreditsSensitiveType] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const res = await fetch("/api/artworks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artworkId: id }),
    });
    if (res.ok) setArtworks((prev) => prev.filter((a) => a.id !== id));
  };

  const openEditCredits = (artwork: Artwork) => {
    const drafts: CreditDraft[] = (artwork.credits ?? []).map((c) =>
      c.userId && c.username
        ? { type: "onsite" as const, value: c.username, label: "" }
        : { type: "offsite" as const, value: c.url ?? "", label: c.label ?? "" }
    );
    setCreditsDrafts(drafts.length > 0 ? drafts : [emptyCredit()]);
    setCreditsCharacters(
      (artwork.characters ?? [])
        .filter((c): c is CharStub => typeof c.id === "string")
        .map((c) => ({ id: c.id, name: c.name, numId: c.numId, slug: c.slug }))
    );
    setCreditsSensitiveType(artwork.sensitiveType ?? null);
    setCreditsCharSearch("");
    setCreditsCharResults([]);
    setEditingId(String(artwork.id));
  };

  const searchCreditsChars = async (q: string) => {
    setCreditsCharSearch(q);
    if (!q.trim()) { setCreditsCharResults([]); return; }
    setCreditsCharLoading(true);
    try {
      const res = await fetch(`/api/characters?search=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setCreditsCharResults((data.characters ?? data) as CharStub[]);
      }
    } finally {
      setCreditsCharLoading(false);
    }
  };

  const saveCredits = async () => {
    if (!editingId || !creditsValid(creditsDrafts)) return;
    const credits = creditsDrafts.map((c) => ({ type: c.type, value: c.value.trim(), label: c.label.trim() }));
    const res = await fetch("/api/artworks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artworkId: editingId, credits, characterIds: creditsCharacters.map((c) => c.id), sensitiveType: creditsSensitiveType }),
    });
    if (res.ok) {
      const updated = await res.json();
      const newCredits: ArtworkCredit[] = (updated.credits ?? []).map((c: { id: string; userId: string | null; label: string | null; url: string | null; user: { username: string | null } | null }) => ({
        id: c.id, userId: c.userId, username: c.user?.username ?? null, label: c.label, url: c.url,
      }));
      setArtworks((prev) => prev.map((a) =>
        String(a.id) === editingId ? { ...a, credits: newCredits, characters: creditsCharacters, sensitiveType: creditsSensitiveType } : a
      ));
    }
    setEditingId(null);
  };

  return (
    <Card>
      {lightbox && <Lightbox entry={lightbox} onClose={() => setLightbox(null)} />}

      {/* Edit credits modal */}
      {editingId && (
        <div
          onClick={() => setEditingId(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#141820", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 32, width: "min(960px, 100vw)", maxWidth: "calc(100vw - 64px)", display: "flex", flexDirection: "column", gap: 20 }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Edit credits
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
              {/* Left column ─ characters, sensitive content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Characters in this image */}
                <div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Characters in this image
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {creditsCharacters.map((c) => (
                      <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: "var(--novae-radius-sm)", background: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-tag)" }}>
                        {c.name}
                        <button onClick={() => setCreditsCharacters((prev) => prev.filter((x) => x.id !== c.id))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, fontSize: 13 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ position: "relative", marginTop: 8 }}>
                    <input
                      value={creditsCharSearch}
                      onChange={(e) => searchCreditsChars(e.target.value)}
                      placeholder="Search characters to tag…"
                      style={inputStyle}
                    />
                    {creditsCharResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden" }}>
                        {creditsCharResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              if (!creditsCharacters.find((x) => x.id === c.id)) setCreditsCharacters((prev) => [...prev, c]);
                              setCreditsCharSearch(""); setCreditsCharResults([]);
                            }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {creditsCharLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--novae-text-secondary)" }}>…</span>}
                  </div>
                </div>

                {/* Sensitive type picker */}
                <div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Sensitive content
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {([null, "nudity", "gore"] as const).map((val) => {
                      const label = val === null ? "None" : val === "nudity" ? "Nudity / fan service" : "Gore";
                      const active = creditsSensitiveType === val;
                      return (
                        <button
                          key={String(val)}
                          onClick={() => setCreditsSensitiveType(val)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "var(--novae-radius-sm)",
                            border: `1px solid ${active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-outline-all)"}`,
                            background: active && val !== null ? "rgba(192,32,90,0.12)" : active ? "var(--novae-bg-tag)" : "none",
                            color: active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-text-secondary)",
                            fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                            fontWeight: active ? 600 : 400, cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column ─ credits */}
              <div>
                <span style={{ display: "block", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Credits
                </span>
                <ArtworkCreditsEditor credits={creditsDrafts} onChange={setCreditsDrafts} meUsername={username} inputStyle={{ fontSize: "var(--novae-text-sm)" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={saveCredits}
                disabled={!creditsValid(creditsDrafts)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: creditsValid(creditsDrafts) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
                  border: "none", borderRadius: "var(--novae-radius-md)",
                  color: creditsValid(creditsDrafts) ? "#fff" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600,
                  cursor: creditsValid(creditsDrafts) ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["mine", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "5px 14px",
              borderRadius: "var(--novae-radius-md)",
              border: filter === f ? "none" : "1px solid var(--novae-outline-all)",
              background: filter === f ? "var(--novae-btn-primary)" : "none",
              color: filter === f ? "#fff" : "var(--novae-text-secondary)",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-sm)",
              fontWeight: filter === f ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {f === "mine" ? t.mine : t.all_}
          </button>
        ))}
      </div>

      <div style={{ columnCount: 3, columnGap: 16 }}>
        {visibleArtworks.map((a) => (
          <ArtworkCard
            key={a.id}
            artwork={a}
            onClick={() => setLightbox({ url: a.image ?? "", credits: a.credits ?? [], characters: a.characters })}
            isOwner={isOwner}
            onDelete={handleDelete}
            onEdit={openEditCredits}
          />
        ))}
      </div>

      <style>{`
        .artwork-card-wrap:hover .artwork-card-actions { opacity: 1 !important; }
      `}</style>
    </Card>
  );
}
