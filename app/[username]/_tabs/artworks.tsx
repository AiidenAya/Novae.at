"use client";

import { useState, useEffect } from "react";
import { Card, IconHeart } from "../_shared";
import type { Artwork } from "../_mock-data";

type LightboxEntry = { url: string; artist: string | null; characters: Artwork["characters"] };
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

function ArtistCredit({ artist }: { artist: string }) {
  if (artist.startsWith("@")) {
    return <a href={`/${artist.slice(1)}`} style={{ color: "var(--novae-text-link)", textDecoration: "none" }}>{artist}</a>;
  }
  if (artist.includes("::")) {
    const [label, url] = artist.split("::");
    return <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--novae-text-link)", textDecoration: "none" }}>{label}</a>;
  }
  if (artist.startsWith("http")) {
    return <a href={artist} target="_blank" rel="noopener noreferrer" style={{ color: "var(--novae-text-link)", textDecoration: "none" }}>{artist}</a>;
  }
  return <span>{artist}</span>;
}

function Lightbox({ entry, onClose }: { entry: LightboxEntry; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, cursor: "zoom-out" }}
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
        {entry.artist && (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Art by <ArtistCredit artist={entry.artist} />
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
        {artwork.image
          ? <img src={artwork.image} alt={artwork.title} style={{ width: "100%", display: "block", pointerEvents: "none" }} />
          : <div style={{ width: "100%", aspectRatio: artwork.aspectRatio ?? "1/1", background: artwork.fill ?? "rgba(105,61,169,0.15)" }} />
        }
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

export default function ArtworksTab({
  artworks: initial, isOwner = false, username = "",
}: {
  artworks: Artwork[];
  isOwner?: boolean;
  username?: string;
}) {
  const [artworks, setArtworks] = useState(initial);
  const [lightbox, setLightbox] = useState<LightboxEntry | null>(null);

  // Edit credits modal state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creditsType, setCreditsType] = useState<"onsite" | "offsite">("onsite");
  const [creditsValue, setCreditsValue] = useState("");
  const [creditsLabel, setCreditsLabel] = useState("");
  const [creditsCharacters, setCreditsCharacters] = useState<CharStub[]>([]);
  const [creditsCharSearch, setCreditsCharSearch] = useState("");
  const [creditsCharResults, setCreditsCharResults] = useState<CharStub[]>([]);
  const [creditsCharLoading, setCreditsCharLoading] = useState(false);

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
    const title = artwork.title ?? "";
    if (title.startsWith("@")) {
      setCreditsType("onsite");
      setCreditsValue(title.slice(1));
      setCreditsLabel("");
    } else if (title.includes("::")) {
      const [label, url] = title.split("::");
      setCreditsType("offsite");
      setCreditsLabel(label);
      setCreditsValue(url);
    } else {
      setCreditsType("onsite");
      setCreditsValue(title);
      setCreditsLabel("");
    }
    setCreditsCharacters(
      (artwork.characters ?? [])
        .filter((c): c is CharStub => typeof c.id === "string")
        .map((c) => ({ id: c.id, name: c.name, numId: c.numId, slug: c.slug }))
    );
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
    if (!editingId) return;
    const raw = creditsValue.trim();
    const label = creditsLabel.trim();
    const newTitle = creditsType === "onsite"
      ? `@${raw.replace(/^@/, "")}`
      : label ? `${label}::${raw}` : raw;
    const res = await fetch("/api/artworks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artworkId: editingId, title: newTitle, characterIds: creditsCharacters.map((c) => c.id) }),
    });
    if (res.ok) {
      setArtworks((prev) => prev.map((a) =>
        String(a.id) === editingId ? { ...a, title: newTitle, characters: creditsCharacters } : a
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
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#141820", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Edit credits
            </h2>

            {/* Toggle */}
            <div style={{ display: "flex", borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
              {(["onsite", "offsite"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCreditsType(t); setCreditsValue(""); setCreditsLabel(""); }}
                  style={{
                    flex: 1, padding: "8px 0",
                    background: creditsType === t ? "var(--novae-btn-primary)" : "none",
                    border: "none",
                    color: creditsType === t ? "#fff" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                    fontWeight: creditsType === t ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {t === "onsite" ? "On Novae" : "External"}
                </button>
              ))}
            </div>

            {creditsType === "offsite" && (
              <input
                autoFocus
                value={creditsLabel}
                onChange={(e) => setCreditsLabel(e.target.value)}
                placeholder="Display name (e.g. AiidenAya)"
                style={inputStyle}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {creditsType === "onsite" && username && (
                <button
                  type="button"
                  onClick={() => setCreditsValue(username)}
                  style={{ alignSelf: "flex-start", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
                >
                  Me (@{username})
                </button>
              )}
              <input
                autoFocus={creditsType === "onsite"}
                value={creditsValue}
                onChange={(e) => setCreditsValue(e.target.value)}
                placeholder={creditsType === "onsite" ? "username" : "https://..."}
                onKeyDown={(e) => { if (e.key === "Enter") saveCredits(); }}
                style={inputStyle}
              />
            </div>

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
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden" }}>
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

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCredits} style={{ flex: 1, padding: "10px 0", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ columnCount: 3, columnGap: 16 }}>
        {artworks.map((a) => (
          <ArtworkCard
            key={a.id}
            artwork={a}
            onClick={() => setLightbox({ url: a.image ?? "", artist: a.title || null, characters: a.characters })}
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
