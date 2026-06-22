"use client";

import { Card, IconHeart } from "../_shared";
import type { Artwork } from "../_mock-data";

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <div style={{ display: "inline-block", width: "100%", marginBottom: 16, breakInside: "avoid" }}>
      <div style={{ width: "100%", borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)", position: "relative" }}>
        {artwork.image
          ? <img src={artwork.image} alt={artwork.title} style={{ width: "100%", display: "block" }} />
          : <div style={{ width: "100%", aspectRatio: artwork.aspectRatio ?? "1/1", background: artwork.fill ?? "rgba(105,61,169,0.15)" }} />
        }
        {artwork.character && (
          <a
            href={`/library/characters/${artwork.character.numId}-${artwork.character.slug}`}
            style={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(15,18,28,0.75)", backdropFilter: "blur(4px)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 8px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none", whiteSpace: "nowrap", maxWidth: "calc(100% - 16px)", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}
          >
            {artwork.character.name}
          </a>
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
  return (
    <Card>
      <div style={{ columnCount: 3, columnGap: 16 }}>
        {artworks.map((a) => <ArtworkCard key={a.id} artwork={a} />)}
      </div>
    </Card>
  );
}
