"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Char = {
  id: string;
  numId: number;
  slug: string;
  name: string;
  avatarUrl: string | null;
  artworks: { imageUrl: string }[];
  tags: { tag: { id: string; name: string } }[];
  favorites: unknown[];
};

function ConfirmDialog({ name, onConfirm, onCancel, pending }: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--novae-bg-main)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 360, display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: "0 0 8px" }}>
            Delete character?
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0, lineHeight: 1.5 }}>
            <strong style={{ color: "var(--novae-text-primary)" }}>{name}</strong> and all their artwork will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={pending}
            style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={pending}
            style={{ background: "#c0392b", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: pending ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "#fff", opacity: pending ? 0.6 : 1 }}
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CharacterGrid({ characters }: { characters: Char[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [localChars, setLocalChars] = useState(characters);

  const confirmChar = localChars.find((c) => c.id === confirmId);

  async function handleDelete() {
    if (!confirmId) return;
    const res = await fetch(`/api/characters/${confirmId}`, { method: "DELETE" });
    if (res.ok) {
      setLocalChars((cs) => cs.filter((c) => c.id !== confirmId));
      setConfirmId(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <>
      {confirmChar && (
        <ConfirmDialog
          name={confirmChar.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
          pending={pending}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
        {localChars.map((char) => {
          const cover = char.avatarUrl ?? char.artworks[0]?.imageUrl ?? null;
          return (
            <div key={char.id} style={{ position: "relative" }}>
              <Link href={`/library/characters/${char.numId}-${char.slug}`} style={{ textDecoration: "none" }}>
                <div className="character-card">
                  <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--novae-bg-main)", position: "relative" }}>
                    {cover ? (
                      <Image src={cover} alt={char.name} fill sizes="220px" className="object-cover" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.3}>
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px" }}>
                    <p style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {char.name}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {char.tags.map(({ tag }) => (
                        <span key={tag.id} style={{ padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", border: "0.5px solid var(--novae-outline-tag)", background: "var(--novae-bg-tag)", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-tag)" }}>
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <span style={{ fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                        {char.favorites.length} ♥
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Delete button — outside Link to avoid navigation */}
              <button
                onClick={(e) => { e.preventDefault(); setConfirmId(char.id); }}
                title="Delete character"
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
