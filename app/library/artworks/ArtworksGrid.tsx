"use client";

import { useState } from "react";
import { IconHeart } from "@/app/[username]/_shared";
import type { Artwork } from "@/app/[username]/_mock-data";

const PAGE_SIZE = 15; // 5 columns × 3 rows

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ width: "100%", borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)", position: "relative" }}>
        {artwork.image
          ? <img src={artwork.image} alt={artwork.title} style={{ width: "100%", display: "block", aspectRatio: "1/1", objectFit: "cover" }} />
          : <div style={{ width: "100%", aspectRatio: "1/1", background: artwork.fill ?? "rgba(105,61,169,0.15)" }} />
        }
        {artwork.characters.length > 0 && (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {artwork.characters.map((c) => (
              <a
                key={c.numId}
                href={`/library/characters/${c.numId}-${c.slug}`}
                style={{ backgroundColor: "rgba(15,18,28,0.75)", backdropFilter: "blur(4px)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 8px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none", whiteSpace: "nowrap" }}
              >
                {c.name}
              </a>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 3, color: "var(--novae-text-secondary)" }}>
        <IconHeart />
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{artwork.hearts}</span>
      </div>
    </div>
  );
}

export default function ArtworksGrid({ artworks }: { artworks: Artwork[] }) {
  const [page, setPage] = useState(1);
  const visible = artworks.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < artworks.length;

  if (artworks.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 0", color: "var(--novae-text-secondary)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
        </svg>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", margin: 0 }}>
          No artworks yet.
        </p>
        <a
          href="/library/new/multi-image"
          style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none" }}
        >
          Upload your first images →
        </a>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {visible.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
      </div>
      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "10px 32px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer" }}
          >
            Voir plus
          </button>
        </div>
      )}
    </div>
  );
}
