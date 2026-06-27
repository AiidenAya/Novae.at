"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { thumbUrl } from "@/lib/thumb";

type NotifActor    = { id: string; username: string | null; name: string | null; avatar: string | null };
type NotifCharacter = { id: string; numId: number; slug: string; name: string; avatarUrl: string | null };
type NotifArtwork  = { id: string; thumbnailUrl: string | null; imageUrl: string; title: string | null };

export type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: NotifActor;
  character: NotifCharacter | null;
  artwork: NotifArtwork | null;
};

// ── Grouping ──────────────────────────────────────────────────────────────────

type CharGroup = {
  character: NotifCharacter | null;
  newCharacter: Notification | null;
  newArtworks: Notification[];
};
type ActorGroup = {
  actor: NotifActor;
  chars: Map<string, CharGroup>;
  unread: boolean;
};

function groupNotifications(notifs: Notification[]): ActorGroup[] {
  const actors = new Map<string, ActorGroup>();

  for (const n of notifs) {
    const actorId = n.actor.id;
    if (!actors.has(actorId)) {
      actors.set(actorId, { actor: n.actor, chars: new Map(), unread: false });
    }
    const ag = actors.get(actorId)!;
    if (!n.read) ag.unread = true;

    const charKey = n.character?.id ?? "__none__";
    if (!ag.chars.has(charKey)) {
      ag.chars.set(charKey, { character: n.character, newCharacter: null, newArtworks: [] });
    }
    const cg = ag.chars.get(charKey)!;
    if (n.type === "new_character") cg.newCharacter = n;
    if (n.type === "new_artwork")   cg.newArtworks.push(n);
  }

  return [...actors.values()];
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ArtworkStrip({ artworks }: { artworks: Notification[] }) {
  const shown = artworks.slice(0, 5);
  const extra = artworks.length - shown.length;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {shown.map((n) => {
        const src = n.artwork?.thumbnailUrl ?? n.artwork?.imageUrl;
        const href = n.character ? `/library/characters/${n.character.numId}-${n.character.slug}` : "#";
        return (
          <Link key={n.id} href={href} style={{ display: "block", width: 48, height: 48, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", background: "rgba(105,61,169,0.15)", flexShrink: 0 }}>
            {src && <img src={thumbUrl(src, 96) ?? src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          </Link>
        );
      })}
      {extra > 0 && (
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
          +{extra} more
        </span>
      )}
    </div>
  );
}

function CharGroupRow({ cg }: { cg: CharGroup }) {
  const charHref = cg.character ? `/library/characters/${cg.character.numId}-${cg.character.slug}` : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 12, borderLeft: "2px solid var(--novae-outline-all)" }}>
      {/* Character header */}
      {cg.character && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", background: "rgba(105,61,169,0.15)", flexShrink: 0 }}>
            {cg.character.avatarUrl && <img src={thumbUrl(cg.character.avatarUrl, 64) ?? cg.character.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
          </div>
          {charHref
            ? <Link href={charHref} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none" }}>{cg.character.name}</Link>
            : <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{cg.character.name}</span>
          }
        </div>
      )}

      {/* New character event */}
      {cg.newCharacter && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", background: "rgba(105,61,169,0.15)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-btn-primary)" }}>
            ✦ New character
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
            {relativeTime(cg.newCharacter.createdAt)}
          </span>
        </div>
      )}

      {/* New artworks */}
      {cg.newArtworks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", background: "rgba(105,61,169,0.08)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>
              🖼 {cg.newArtworks.length} new {cg.newArtworks.length === 1 ? "image" : "images"}
            </span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {relativeTime(cg.newArtworks[0].createdAt)}
            </span>
          </div>
          <ArtworkStrip artworks={cg.newArtworks} />
        </div>
      )}
    </div>
  );
}

function ActorCard({ ag, onMarkRead }: { ag: ActorGroup; onMarkRead: (ids: string[]) => void }) {
  const allIds = [...ag.chars.values()].flatMap((cg) => [
    cg.newCharacter?.id,
    ...cg.newArtworks.map((n) => n.id),
  ]).filter(Boolean) as string[];

  return (
    <div style={{ background: "var(--novae-bg-card)", border: `1px solid ${ag.unread ? "var(--novae-btn-primary)" : "var(--novae-outline-all)"}`, borderRadius: "var(--novae-radius-lg)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Actor header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href={ag.actor.username ? `/${ag.actor.username}` : "#"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "rgba(105,61,169,0.15)", flexShrink: 0 }}>
            {ag.actor.avatar
              ? <img src={thumbUrl(ag.actor.avatar, 80) ?? ag.actor.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 16, color: "var(--novae-text-link)" }}>
                  {(ag.actor.name ?? ag.actor.username)?.[0]?.toUpperCase() ?? "?"}
                </div>
            }
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "var(--novae-text-link)" }}>
              {ag.actor.name ?? ag.actor.username}
            </span>
            {ag.actor.username && (
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                @{ag.actor.username}
              </span>
            )}
          </div>
        </Link>
        {ag.unread && (
          <button
            onClick={() => onMarkRead(allIds)}
            style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "4px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
          >
            Mark read
          </button>
        )}
      </div>

      {/* Character groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[...ag.chars.values()].map((cg, i) => <CharGroupRow key={i} cg={cg} />)}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifs, setNotifs] = useState(initial);

  useEffect(() => {
    // mark all as read after 2s on the server side
    const t = setTimeout(() => {
      fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  const markRead = (ids: string[]) => {
    setNotifs((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, read: true } : n));
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
  };

  const groups = groupNotifications(notifs);
  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p style={{ margin: "4px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              const ids = notifs.filter((n) => !n.read).map((n) => n.id);
              markRead(ids);
            }}
            style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 16px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Groups */}
      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <p style={{ margin: 0 }}>No notifications yet. Follow some creators to get started!</p>
        </div>
      ) : (
        groups.map((ag) => <ActorCard key={ag.actor.id} ag={ag} onMarkRead={markRead} />)
      )}
    </div>
  );
}
