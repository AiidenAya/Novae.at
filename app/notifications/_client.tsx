"use client";

import { useState } from "react";
import Link from "next/link";
import { thumbUrl } from "@/lib/thumb";
import SensitiveImageWrapper from "@/components/SensitiveImageWrapper";
import { useT } from "@/lib/locale-context";
import type { T } from "@/lib/use-locale";

// Widen the literal-typed translation object so either locale is assignable.
type Tr = { readonly [K in keyof T]: string };

type NotifActor    = { id: string; username: string | null; name: string | null; avatar: string | null };
type NotifCharacter = { id: string; numId: number; slug: string; name: string; avatarUrl: string | null };
type NotifArtwork  = { id: string; thumbnailUrl: string | null; imageUrl: string; title: string | null; sensitiveType: string | null };
type NotifRelChar  = { numId: number; slug: string; name: string; avatarUrl: string | null };
type NotifRelationship = { id: string; type: string; status: string; characterA: NotifRelChar | null; characterB: NotifRelChar | null };

export type Notification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor: NotifActor;
  character: NotifCharacter | null;
  artwork: NotifArtwork | null;
  relationship: NotifRelationship | null;
};

// ── Type categories ─────────────────────────────────────────────────────────────

type CategoryKey = "characters" | "artworks" | "follows" | "favorites" | "relationships";

const CATEGORY_ICON: Record<CategoryKey, string> = {
  follows: "✦", favorites: "✦", relationships: "✦", characters: "✦", artworks: "✦",
};
const CATEGORY_ORDER: CategoryKey[] = ["follows", "favorites", "relationships", "characters", "artworks"];

function categoryLabel(c: CategoryKey, t: Tr): string {
  switch (c) {
    case "follows":       return t.notifCatFollows;
    case "favorites":     return t.notifCatFavorites;
    case "relationships": return t.notifCatRelationships;
    case "characters":    return t.notifCatCharacters;
    case "artworks":      return t.notifCatArtworks;
  }
}

function categoryOf(type: string): CategoryKey {
  if (type === "new_character") return "characters";
  if (type === "new_artwork") return "artworks";
  if (type === "new_follower") return "follows";
  if (type === "new_favorite") return "favorites";
  return "relationships"; // rel_request | rel_accepted | rel_declined
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string, t: Tr) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return t.notifJustNow;
  if (mins < 60)  return t.notifMinAgo.replace("{n}", String(mins));
  if (hours < 24) return t.notifHourAgo.replace("{n}", String(hours));
  if (days < 7)   return t.notifDayAgo.replace("{n}", String(days));
  return new Date(iso).toLocaleDateString();
}

// ── Single notification row ─────────────────────────────────────────────────────

function CharLink({ c }: { c: NotifCharacter | NotifRelChar }) {
  return (
    <Link href={`/library/characters/${c.numId}-${c.slug}`} style={{ fontWeight: 600, color: "var(--novae-text-link)", textDecoration: "none" }}>
      {c.name}
    </Link>
  );
}

function NotificationRow({ n, onMarkRead, onRespond }: { n: Notification; onMarkRead: (ids: string[]) => void; onRespond: (n: Notification, action: "accept" | "decline") => void }) {
  const { t } = useT();
  const actorName = n.actor.name ?? n.actor.username ?? t.notifSomeone;

  // The right-side visual (thumbnail / avatar) and the message body, per type.
  let badge: { icon: string; bg: string; color: string } | null = null;
  let body: React.ReactNode = null;
  let thumb: React.ReactNode = null;

  if (n.type === "new_character") {
    badge = { icon: "✦", bg: "rgba(105,61,169,0.15)", color: "var(--novae-btn-primary)" };
    body = <>{t.notifCreatedCharacter}{n.character ? <> {" "}<CharLink c={n.character} /></> : null}.</>;
  } else if (n.type === "new_artwork") {
    badge = { icon: "✦", bg: "rgba(105,61,169,0.08)", color: "var(--novae-text-secondary)" };
    body = <>{t.notifUploadedImage}{n.character ? <> {" "}{t.notifOn}{" "}<CharLink c={n.character} /></> : null}.</>;
    const src = n.artwork?.thumbnailUrl ?? n.artwork?.imageUrl;
    const href = n.character ? `/library/characters/${n.character.numId}-${n.character.slug}` : "#";
    if (src) thumb = (
      <Link href={href} style={{ display: "block", width: 48, height: 48, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <SensitiveImageWrapper sensitiveType={n.artwork?.sensitiveType ?? null}>
          <img src={thumbUrl(src, 96) ?? src} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </SensitiveImageWrapper>
      </Link>
    );
  } else if (n.type === "new_follower") {
    badge = { icon: "✦", bg: "rgba(105,61,169,0.15)", color: "var(--novae-btn-primary)" };
    body = <>{t.notifStartedFollowing}</>;
  } else if (n.type === "new_favorite") {
    badge = { icon: "✦", bg: "rgba(220,50,50,0.12)", color: "#e05252" };
    body = <>{t.notifFavorited}{n.character ? <> {" "}<CharLink c={n.character} /></> : null}.</>;
  } else if (n.type === "rel_request") {
    badge = { icon: "✦", bg: "rgba(105,61,169,0.15)", color: "var(--novae-btn-primary)" };
    const rel = n.relationship;
    const mine = rel?.characterB;
    const theirs = rel?.characterA;
    body = (
      <>
        {t.notifWantsToLink} <strong>{theirs?.name ?? t.notifTheirCharacter}</strong>
        {rel?.type ? <> {t.notifAs} <em>{rel.type}</em></> : null}
        {mine ? <> {t.notifWithYour} <strong>{mine.name}</strong></> : null}.
      </>
    );
  } else if (n.type === "rel_accepted") {
    badge = { icon: "✓", bg: "rgba(80,180,100,0.15)", color: "#3fa75a" };
    body = <>{t.notifAcceptedRequest}{n.relationship?.characterB ? <> {t.notifWith}{" "}<CharLink c={n.relationship.characterB} /></> : null}.</>;
  } else if (n.type === "rel_declined") {
    badge = { icon: "✕", bg: "rgba(220,50,50,0.12)", color: "#e05252" };
    body = <>{t.notifDeclinedRel}</>;
  } else {
    body = <>{t.notifGeneric}</>;
  }

  const rel = n.relationship;
  const showRespond = n.type === "rel_request" && rel?.status === "pending";

  return (
    <div style={{ position: "relative", display: "flex", gap: 12, alignItems: "flex-start", background: "var(--novae-bg-card)", border: `1px solid ${n.read ? "var(--novae-outline-all)" : "var(--novae-btn-primary)"}`, borderRadius: "var(--novae-radius-lg)", padding: 16, opacity: n.read ? 0.55 : 1, transition: "opacity 0.2s" }}>
      {/* Unread dot */}
      {!n.read && <span style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: "var(--novae-btn-primary)" }} />}

      {/* Actor avatar */}
      <Link href={n.actor.username ? `/~${n.actor.username}` : "#"} style={{ flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "rgba(105,61,169,0.15)" }}>
          {n.actor.avatar
            ? <img src={thumbUrl(n.actor.avatar, 80) ?? n.actor.avatar} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 16, color: "var(--novae-text-link)" }}>{actorName[0]?.toUpperCase() ?? "?"}</div>}
        </div>
      </Link>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {badge && (
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "var(--novae-radius-sm)", background: badge.bg, fontSize: 12, color: badge.color, flexShrink: 0 }}>{badge.icon}</span>
          )}
          <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", lineHeight: 1.5 }}>
            <Link href={n.actor.username ? `/~${n.actor.username}` : "#"} style={{ fontWeight: 700, color: "var(--novae-text-primary)", textDecoration: "none" }}>{actorName}</Link>{" "}
            {body}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{relativeTime(n.createdAt, t)}</span>
          {!n.read && (
            <button onClick={() => onMarkRead([n.id])} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-link)" }}>
              {t.notifMarkRead}
            </button>
          )}
        </div>

        {/* Relationship request actions */}
        {showRespond && (
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button onClick={() => onRespond(n, "accept")} style={{ padding: "6px 16px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-sm)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer" }}>{t.notifAccept}</button>
            <button onClick={() => onRespond(n, "decline")} style={{ padding: "6px 16px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>{t.notifDecline}</button>
          </div>
        )}
        {n.type === "rel_request" && rel && rel.status !== "pending" && (
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
            {rel.status === "accepted" ? t.notifAccepted : t.notifRequestUnavailable}
          </span>
        )}
      </div>

      {thumb}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const { t } = useT();
  const [notifs, setNotifs] = useState(initial);
  const [filter, setFilter] = useState<CategoryKey | "all">("all");

  const markRead = (ids: string[]) => {
    setNotifs((prev) => {
      const next = prev.map((n) => ids.includes(n.id) ? { ...n, read: true } : n);
      const remaining = next.filter((n) => !n.read).length;
      window.dispatchEvent(new CustomEvent("novae:notifications-read", { detail: { remaining } }));
      return next;
    });
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
  };

  const respond = async (n: Notification, action: "accept" | "decline") => {
    if (!n.relationship) return;
    const newStatus = action === "accept" ? "accepted" : "declined";
    // optimistic: mark read + update embedded relationship status
    setNotifs((prev) => {
      const next = prev.map((x) => x.id === n.id
        ? { ...x, read: true, relationship: x.relationship ? { ...x.relationship, status: newStatus } : null }
        : x);
      const remaining = next.filter((x) => !x.read).length;
      window.dispatchEvent(new CustomEvent("novae:notifications-read", { detail: { remaining } }));
      return next;
    });
    const res = await fetch(`/api/relationships/${n.relationship.id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      setNotifs((prev) => prev.map((x) => x.id === n.id
        ? { ...x, relationship: x.relationship ? { ...x.relationship, status: "pending" } : null }
        : x));
    }
    fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [n.id] }) });
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  // categories that actually have notifications, in display order
  const presentCategories = CATEGORY_ORDER.filter((c) => notifs.some((n) => !n.read && categoryOf(n.type) === c));

  const visible = (filter === "all" ? notifs : notifs.filter((n) => categoryOf(n.type) === filter)).filter((n) => !n.read);
  const sections = CATEGORY_ORDER
    .filter((c) => filter === "all" || filter === c)
    .map((c) => ({ category: c, items: visible.filter((n) => categoryOf(n.type) === c) }))
    .filter((s) => s.items.length > 0);

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 999, cursor: "pointer",
    border: `1px solid ${active ? "var(--novae-btn-primary)" : "var(--novae-outline-all)"}`,
    background: active ? "var(--novae-btn-primary)" : "none",
    color: active ? "#fff" : "var(--novae-text-secondary)",
    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: active ? 600 : 400,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            {t.notifTitle}
          </h1>
          {unreadCount > 0 && (
            <p style={{ margin: "4px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {t.notifUnread.replace("{n}", String(unreadCount))}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markRead(notifs.filter((n) => !n.read).map((n) => n.id))}
            style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 16px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
          >
            {t.notifMarkAllRead}
          </button>
        )}
      </div>

      {/* Filter chips */}
      {presentCategories.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setFilter("all")} style={chipStyle(filter === "all")}>{t.notifAll}</button>
          {presentCategories.map((c) => (
            <button key={c} onClick={() => setFilter(c)} style={chipStyle(filter === c)}>
              {CATEGORY_ICON[c]} {categoryLabel(c, t)}
            </button>
          ))}
        </div>
      )}

      {/* Sections grouped by type */}
      {sections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
          <p style={{ margin: 0 }}>{t.notifEmpty}</p>
        </div>
      ) : (
        sections.map(({ category, items }) => (
          <div key={category} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-secondary)" }}>
              <span>{CATEGORY_ICON[category]}</span>
              {categoryLabel(category, t)}
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 400, color: "var(--novae-text-secondary)" }}>{items.length}</span>
            </h2>
            {items.map((n) => <NotificationRow key={n.id} n={n} onMarkRead={markRead} onRespond={respond} />)}
          </div>
        ))
      )}
    </div>
  );
}
