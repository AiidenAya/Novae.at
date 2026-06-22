"use client";

import { useState } from "react";
import { Card, IconHeart } from "../_shared";
import type { Artwork } from "../_mock-data";

type LightboxEntry = { url: string; artist: string | null; characters: Artwork["characters"] };

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

function ArtworkCard({ artwork, onClick }: { artwork: Artwork; onClick: () => void }) {
  return (
    <div style={{ display: "block", marginBottom: 16, breakInside: "avoid" }}>
      <div
        onClick={onClick}
        style={{ width: "100%", borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)", position: "relative", cursor: "zoom-in" }}
      >
        {artwork.image
          ? <img src={artwork.image} alt={artwork.title} style={{ width: "100%", display: "block" }} />
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
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, paddingTop: 16, paddingBottom: 16, color: "var(--novae-text-secondary)" }}>
        <IconHeart />
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{artwork.hearts}</span>
      </div>
    </div>
  );
}

export default function ArtworksTab({ artworks }: { artworks: Artwork[] }) {
  const [lightbox, setLightbox] = useState<LightboxEntry | null>(null);
  return (
    <Card>
      {lightbox && <Lightbox entry={lightbox} onClose={() => setLightbox(null)} />}
      <div style={{ columnCount: 3, columnGap: 16 }}>
        {artworks.map((a) => (
          <ArtworkCard
            key={a.id}
            artwork={a}
            onClick={() => setLightbox({ url: a.image ?? "", artist: a.title || null, characters: a.characters })}
          />
        ))}
      </div>
    </Card>
  );
}
