"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { thumbUrl } from "@/lib/thumb";
import { useTheme } from "@/lib/use-theme";
import { useT } from "@/lib/locale-context";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function IconGroup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="14" height="7" viewBox="0 0 14 7" fill="none">
      <path d="M1 1L7 6L13 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IconSun() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

// ── Dropdown config ───────────────────────────────────────────────────────────

const LIBRARY_ITEMS  = [
  { label: "Characters", href: "/library/characters" },
  { label: "Favorites", href: "/library/favorites" },
];

const BROWSE_ITEMS = [
  { label: "Characters", href: "/browse/characters" },
  { label: "Worlds",     href: "/browse/worlds" },
  { label: "Species",    href: "/browse/species" },
  { label: "Artists",    href: "/browse/artists" },
];

const COMMUNITY_ITEMS = [
  { label: "Characters", href: "/community/characters" },
  { label: "Worlds",     href: "/community/worlds" },
  { label: "Artworks",   href: "/community/artworks" },
  { label: "Favorites",  href: "/community/favorites" },
];

// ── Reusable dropdown panel ───────────────────────────────────────────────────

function DropdownPanel({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <div
      className={`absolute top-full mt-2 min-w-[200px] rounded-[var(--novae-radius-md)] border flex flex-col gap-4 px-8 py-6 z-50${align === "right" ? " right-0" : " left-0"}`}
      style={{
        backgroundColor: "var(--novae-bg-main)",
        borderColor: "var(--novae-outline-all)",
      }}
    >
      {children}
    </div>
  );
}

function DropdownLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="font-medium whitespace-nowrap transition-opacity hover:opacity-70"
      style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "var(--novae-text-lg)",
        fontWeight: 500,
        color: "var(--novae-text-primary)",
      }}
    >
      {label}
    </Link>
  );
}

function Divider() {
  return <div className="w-10 h-px shrink-0" style={{ backgroundColor: "var(--novae-outline-all)" }} />;
}

type DropdownKey = "library" | "browse" | "community" | "profile" | null;

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ count }: { count: number }) {
  return (
    <span
      className="px-3 py-1 rounded-[var(--novae-radius-md)] text-sm min-w-[31px] text-center"
      style={{
        fontFamily: "var(--font-space-grotesk)",
        fontSize: "var(--novae-text-base)",
        color: "var(--novae-text-link)",
        backgroundColor: "rgba(105,61,169,0.3)",
      }}
    >
      {count}
    </span>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" aria-label="Novae home" className="flex items-start gap-0 shrink-0">
      <span
        className="font-bold leading-none"
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontSize: 28,
          color: "var(--novae-text-primary)",
          letterSpacing: "-1px",
        }}
      >
        Novae
      </span>
      <span
        style={{
          color: "var(--novae-btn-primary)",
          fontSize: 12,
          lineHeight: 1,
          marginTop: 2,
        }}
      >
        ✦
      </span>
    </Link>
  );
}

// ── Ticket / Bug report ───────────────────────────────────────────────────────

function TicketButton() {
  const { data: session } = useSession();
  const [open, setOpen]   = useState(false);
  const [body, setBody]   = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent]   = useState<{ url: string; number: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, locale, toggle: toggleLocale } = useT();

  function reset() { setBody(""); setSent(null); setError(null); }

  async function send() {
    const username = (session?.user as Record<string, unknown> | undefined)?.username as string | undefined ?? session?.user?.email ?? "inconnu";
    setSending(true);
    setError(null);
    const res = await fetch("/api/bug-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `[Bug] signalé par @${username}`, body }),
    });
    const data = await res.json();
    if (res.ok) setSent(data);
    else setError(data.error ?? "Erreur");
    setSending(false);
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: "var(--novae-radius-md)",
    border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-main)",
    color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)", outline: "none", boxSizing: "border-box",
    resize: "vertical" as const,
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="nav-links items-center justify-center"
        title={t.reportTitle}
        style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 12px", cursor: "pointer", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
          <path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", top: 72, left: 0, right: 0, bottom: 0, zIndex: 9998, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
            onClick={() => setOpen(false)}
          />
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "30vh", pointerEvents: "none" }}>
            <div style={{ pointerEvents: "all", background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: 460, display: "flex", flexDirection: "column", gap: 16 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>{t.reportTitle}</h2>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", display: "flex" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {sent ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", padding: "16px 0" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#48c78e" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <p style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-primary)", margin: 0, textAlign: "center" }}>
                    Issue <a href={sent.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--novae-text-link)" }}>#{sent.number}</a> créée avec succès.
                  </p>
                  <button onClick={() => setOpen(false)} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600 }}>Fermer</button>
                </div>
              ) : (
                <>
                  {error && <p style={{ color: "#ff6b7a", fontSize: "var(--novae-text-sm)", margin: 0 }}>{error}</p>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder={t.reportPlaceholder} style={inp} />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setOpen(false)} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>{t.cancel}</button>
                    <button onClick={send} disabled={sending} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "8px 20px", cursor: sending ? "not-allowed" : "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, opacity: sending ? 0.6 : 1 }}>
                      {sending ? t.sending : t.send}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session, isPending } = useSession();

  const [open, setOpen] = useState<DropdownKey>(null);
  const [dbAvatar, setDbAvatar] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t, locale, toggle: toggleLocale } = useT();

  // Fetch avatar from DB whenever session changes (bypasses session cache)
  useEffect(() => {
    if (!session?.user) { setDbAvatar(null); setUnreadCount(0); return; }
    fetch("/api/me").then(r => r.json()).then(d => setDbAvatar(d.avatar ?? null)).catch(() => {});
    fetch("/api/notifications").then(r => r.json()).then((d: {read: boolean}[]) => {
      if (Array.isArray(d)) setUnreadCount(d.filter((n) => !n.read).length);
    }).catch(() => {});
  }, [session?.user?.id]);

  // Live-sync the unread badge when notifications are read elsewhere (e.g. /notifications page)
  useEffect(() => {
    function onRead(e: Event) {
      const detail = (e as CustomEvent).detail as { remaining?: number } | undefined;
      if (detail && typeof detail.remaining === "number") setUnreadCount(detail.remaining);
      else setUnreadCount(0);
    }
    window.addEventListener("novae:notifications-read", onRead);
    return () => window.removeEventListener("novae:notifications-read", onRead);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on route change
  useEffect(() => { setOpen(null); }, [pathname]);

  function toggle(key: DropdownKey) {
    setOpen((prev) => (prev === key ? null : key));
  }

  const username  = (session?.user as Record<string, unknown> | undefined)?.username as string | undefined
    ?? session?.user?.email
    ?? null;
  const avatarUrl = dbAvatar ?? session?.user?.image ?? null;
  const roles   = (session?.user as Record<string, unknown> | undefined)?.roles as string[] | undefined ?? [];
  const isAdmin = roles.includes("admin");

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-lg)",
    fontWeight: 500,
    color: active ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu — sibling of header so backdrop-filter doesn't trap it */}
      <div className={`nav-mobile-menu${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)}>
        <Link href="/" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconHome />{t.navHome}</Link>
        <Link href="/library/characters" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconUser />{t.navLibrary}</Link>
        <Link href="/library/favorites" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconUser />Favorites</Link>
        <Link href="/browse" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconSearch />{t.navBrowse}</Link>
        <Link href="/community" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconGroup />{t.navCommunity}</Link>
        <div style={{ height: 1, background: "var(--novae-outline-all)", margin: "8px 0" }} />
        {session ? (
          <>
            <Link href="/library/new" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-btn-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 600 }}><IconPlus />{t.navNew}</Link>
            <Link href={`/${username}`} className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}><IconUser />{t.navProfile}</Link>
            <button onClick={() => { signOut(); setMobileOpen(false); }} className="flex items-center gap-3 py-3 w-full" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}>{t.navLogout}</button>
          </>
        ) : (
          <>
            <Link href="/login" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500 }}>{t.navLogin}</Link>
            <Link href="/register" className="flex items-center gap-3 py-3" style={{ color: "var(--novae-btn-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 600 }}>{t.navSignUp}</Link>
          </>
        )}
      </div>

      <header
        ref={ref}
        className="relative z-50 w-full h-[72px] flex items-center justify-between px-8 border-b"
        style={{
          backgroundColor: "var(--novae-bg-card)",
          borderColor: "var(--novae-outline-all)",
          backdropFilter: "blur(8px)",
        }}
      >

      {/* Left — Logo + nav */}
      <div className="flex items-center self-stretch gap-8">
        <Logo />
        <div className="nav-links w-px h-10 shrink-0" style={{ backgroundColor: "var(--novae-outline-all)" }} />

        <nav className="nav-links items-center self-stretch gap-8">
          {/* Home */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
            style={navItemStyle(pathname === "/")}
          >
            <IconHome />
            {t.navHome}
          </Link>

          {/* My Library */}
          <div className="relative self-stretch flex items-center">
            <button
              onClick={() => toggle("library")}
              className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
              style={navItemStyle(pathname.startsWith("/library"))}
            >
              <IconUser />
              {t.navLibrary}
              <span style={{ color: "var(--novae-text-secondary)", transform: open === "library" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <IconChevron />
              </span>
            </button>
            {open === "library" && (
              <DropdownPanel>
                {LIBRARY_ITEMS.map((item) => <DropdownLink key={item.href} {...item} />)}
              </DropdownPanel>
            )}
          </div>

          {/* Browse — disabled */}
          <div className="relative self-stretch flex items-center">
            <span className="flex items-center gap-2 shrink-0 cursor-not-allowed" style={{ ...navItemStyle(false), opacity: 0.35 }}>
              <IconSearch />
              {t.navBrowse}
            </span>
          </div>

          {/* Community — disabled */}
          <div className="relative self-stretch flex items-center">
            <span className="flex items-center gap-2 shrink-0 cursor-not-allowed" style={{ ...navItemStyle(false), opacity: 0.35 }}>
              <IconGroup />
              {t.navCommunity}
            </span>
          </div>
        </nav>
      </div>

      {/* Right — authenticated or not */}
      <div className="flex items-center gap-6">
        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger items-center justify-center p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-primary)" }}
        >
          {mobileOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          )}
        </button>

        {isPending ? (
          <div style={{ width: 120, height: 40 }} />
        ) : session ? (
          <>
            {/* Ticket button */}
            <TicketButton />

            {/* New button */}
            <Link
              href="/library/new"
              className="nav-links items-center gap-2 px-5 py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "var(--novae-text-lg)",
                fontWeight: 500,
                backgroundColor: "var(--novae-btn-primary)",
                color: "var(--novae-text-btn)",
              }}
            >
              <IconPlus />
              {t.navNew}
            </Link>

            {/* User dropdown — hidden on mobile (hamburger handles it) */}
            <div className="nav-links relative self-stretch items-center">
              <button
                onClick={() => toggle("profile")}
                className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
              >
                {/* Avatar with unread dot */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {avatarUrl ? (
                    <img src={thumbUrl(avatarUrl, 80) ?? avatarUrl} alt={username ?? ""} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className="size-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-primary)" }}
                    >
                      {(username ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: -2, right: -2,
                      minWidth: 18, height: 18,
                      background: "#e53e3e",
                      border: "2px solid var(--novae-bg-card)",
                      borderRadius: 999,
                      fontSize: 10, fontWeight: 700, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: "0 3px",
                      fontFamily: "var(--font-dm-sans)",
                    }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className="font-medium"
                  style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)" }}
                >
                  {username}
                </span>
                <span style={{ color: "var(--novae-text-secondary)", transform: open === "profile" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                  <IconChevron />
                </span>
              </button>

              {open === "profile" && (
                <DropdownPanel align="right">
                  {/* Profile */}
                  <Link
                    href={`/${username}`}
                    className="flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                  >
                    <span className="w-[22px] flex justify-center" style={{ color: "var(--novae-text-secondary)" }}><IconUser /></span>
                    {t.navProfile}
                  </Link>

                  <Divider />

                  {/* Messages */}
                  <div className="flex items-center w-full gap-2" style={{ opacity: 0.4, pointerEvents: "none" }}>
                    <div className="flex items-center gap-2" style={{ color: "var(--novae-text-secondary)" }}>
                      <span className="w-[22px] flex justify-center"><IconMail /></span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)" }}>Messages</span>
                    </div>
                  </div>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                  >
                    <span className="w-[22px] flex justify-center" style={{ color: "var(--novae-text-secondary)", position: "relative" }}>
                      <IconBell />
                      {unreadCount > 0 && (
                        <span style={{ position: "absolute", top: -4, right: -4, minWidth: 14, height: 14, background: "var(--novae-btn-primary)", borderRadius: 999, fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </span>
                    <span>{t.navNotifications}</span>
                  </Link>

                  <Divider />

                  {/* Admin dashboard */}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 w-full transition-opacity hover:opacity-70"
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-tag)" }}
                    >
                      <span className="w-[22px] flex justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z"/>
                          <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                        </svg>
                      </span>
                      Admin
                    </Link>
                  )}

                  {/* Settings */}
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 w-full transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                  >
                    <span className="w-[22px] flex justify-center" style={{ color: "var(--novae-text-secondary)" }}><IconSettings /></span>
                    {t.navSettings}
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={async () => {
                      await signOut();
                      router.push("/");
                    }}
                    className="flex items-center gap-2 w-full transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                  >
                    <span className="w-[22px] flex justify-center" style={{ color: "var(--novae-text-secondary)" }}><IconLogout /></span>
                    {t.navLogout}
                  </button>
                </DropdownPanel>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="nav-links font-medium transition-opacity hover:opacity-70"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)" }}
            >
              {t.navLogin}
            </Link>
            <Link
              href="/register"
              className="nav-links items-center justify-center px-5 py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "var(--novae-text-lg)",
                fontWeight: 500,
                backgroundColor: "var(--novae-btn-primary)",
                color: "var(--novae-text-btn)",
              }}
            >
              {t.navSignUp}
            </Link>
          </>
        )}
      </div>
      </header>
    </>
  );
}
