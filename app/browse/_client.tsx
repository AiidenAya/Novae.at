"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useT } from "@/lib/locale-context";

// ── Types ────────────────────────────────────────────────────────────────────

export type BrowseCharacter = {
  id: string; numId: number; slug: string; name: string; avatarUrl: string | null;
  _count: { artworks: number; favorites: number };
  user: { username: string | null; name: string | null };
};

export type BrowseUser = {
  id: string; username: string | null; name: string | null; avatar: string | null;
  _count: { characters: number; artworks: number; followers: number };
};

// ── Cards (same look as the home page) ───────────────────────────────────────

function CharCard({ char }: { char: BrowseCharacter }) {
  return (
    <Link href={`/library/characters/${char.numId}-${char.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
        <div style={{ position: "relative", aspectRatio: "1/1", background: "rgba(105,61,169,0.1)" }}>
          {char.avatarUrl
            ? <Image src={char.avatarUrl} alt={char.name} fill sizes="(max-width: 768px) 45vw, 200px" style={{ objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.12) 0% 25%, transparent 0% 50%)", backgroundSize: "20px 20px" }} />
          }
        </div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {char.name}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            by {char.user.name ?? char.user.username ?? "unknown"}
          </span>
          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {char._count.favorites}
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              {char._count.artworks}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function UserCard({ user }: { user: BrowseUser }) {
  if (!user.username) return null;
  return (
    <Link href={`/${user.username}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ position: "relative", width: 48, height: 48, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "rgba(105,61,169,0.15)", flexShrink: 0 }}>
          {user.avatar
            ? <Image src={user.avatar} alt={user.name ?? user.username} fill sizes="48px" style={{ objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 20, color: "var(--novae-text-link)" }}>
                {(user.name ?? user.username)?.[0]?.toUpperCase() ?? "?"}
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name ?? user.username}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
            @{user.username}
          </span>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.characters} chars
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.artworks} arts
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.followers} followers
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Browse client ─────────────────────────────────────────────────────────────

type Props =
  | { type: "characters"; initialItems: BrowseCharacter[]; initialHasMore: boolean }
  | { type: "users"; initialItems: BrowseUser[]; initialHasMore: boolean };

export function BrowseClient({ type, initialItems, initialHasMore }: Props) {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<(BrowseCharacter | BrowseUser)[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  async function load(query: string, skip: number, append: boolean) {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/browse?type=${type}&q=${encodeURIComponent(query)}&skip=${skip}`);
      if (!res.ok) return;
      const data = await res.json();
      if (id !== requestId.current) return; // stale response
      setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      setHasMore(data.hasMore);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }

  // Debounced search — skips the initial render (server already provided data)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => load(q, 0, false), 300);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [q]);

  const isChars = type === "characters";

  return (
    <div style={{ width: "100%", padding: "40px 48px 80px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header + search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
          {isChars ? t.browseCharsTitle : t.browseUsersTitle}
        </h1>
        <div style={{ position: "relative", flexBasis: 320, flexGrow: 1, maxWidth: 420 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--novae-text-secondary)", display: "flex" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={isChars ? t.browseSearchCharsPlaceholder : t.browseSearchUsersPlaceholder}
            style={{
              width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 36px",
              borderRadius: "var(--novae-radius-md)", border: "1px solid var(--novae-outline-all)",
              background: "var(--novae-bg-card)", color: "var(--novae-text-primary)",
              fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Results */}
      {items.length === 0 && !loading ? (
        <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
          {q ? t.browseNoResults.replace("{q}", q) : t.browseEmpty}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isChars ? "repeat(auto-fill, minmax(150px, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
          {isChars
            ? (items as BrowseCharacter[]).map((c) => <CharCard key={c.id} char={c} />)
            : (items as BrowseUser[]).map((u) => <UserCard key={u.id} user={u} />)}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => load(q, items.length, true)}
          disabled={loading}
          style={{
            alignSelf: "center", padding: "10px 24px", borderRadius: "var(--novae-radius-md)",
            background: "none", border: "1px solid var(--novae-outline-all)", cursor: loading ? "not-allowed" : "pointer",
            color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600,
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "…" : t.browseLoadMore}
        </button>
      )}
    </div>
  );
}
