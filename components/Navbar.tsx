"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
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
  { label: "Worlds",     href: "/library/worlds" },
  { label: "Artworks",   href: "/library/artworks" },
  { label: "Favorites",  href: "/library/favorites" },
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

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();

  const [open, setOpen] = useState<DropdownKey>(null);
  const ref = useRef<HTMLElement>(null);
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t, locale, toggle: toggleLocale } = useT();

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

  const username  = session?.user?.name ?? session?.user?.email ?? null;
  const avatarUrl = session?.user?.image ?? null;

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-lg)",
    fontWeight: 500,
    color: active ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
  });

  return (
    <header
      ref={ref}
      className="sticky top-0 z-50 w-full h-[72px] flex items-center justify-between px-8 border-b"
      style={{
        backgroundColor: "var(--novae-bg-card)",
        borderColor: "var(--novae-outline-all)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Left — Logo + nav */}
      <div className="flex items-center self-stretch gap-8">
        <Logo />
        <div className="w-px h-10 shrink-0" style={{ backgroundColor: "var(--novae-outline-all)" }} />

        <nav className="flex items-center self-stretch gap-8">
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

          {/* Browse */}
          <div className="relative self-stretch flex items-center">
            <button
              onClick={() => toggle("browse")}
              className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
              style={navItemStyle(pathname.startsWith("/browse"))}
            >
              <IconSearch />
              {t.navBrowse}
              <span style={{ color: "var(--novae-text-secondary)", transform: open === "browse" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <IconChevron />
              </span>
            </button>
            {open === "browse" && (
              <DropdownPanel>
                {BROWSE_ITEMS.map((item) => <DropdownLink key={item.href} {...item} />)}
              </DropdownPanel>
            )}
          </div>

          {/* Community */}
          <div className="relative self-stretch flex items-center">
            <button
              onClick={() => toggle("community")}
              className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
              style={navItemStyle(pathname.startsWith("/community"))}
            >
              <IconGroup />
              {t.navCommunity}
              <span style={{ color: "var(--novae-text-secondary)", transform: open === "community" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <IconChevron />
              </span>
            </button>
            {open === "community" && (
              <DropdownPanel>
                {COMMUNITY_ITEMS.map((item) => <DropdownLink key={item.href} {...item} />)}
              </DropdownPanel>
            )}
          </div>
        </nav>
      </div>

      {/* Right — authenticated or not */}
      <div className="flex items-center gap-6">
        {session ? (
          <>
            {/* New button */}
            <Link
              href="/library/characters/new"
              className="flex items-center gap-2 px-5 py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90"
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

            {/* User dropdown */}
            <div className="relative self-stretch flex items-center">
              <button
                onClick={() => toggle("profile")}
                className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-80"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username ?? ""} className="size-10 rounded-full object-cover" />
                ) : (
                  <div
                    className="size-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0"
                    style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-primary)" }}
                  >
                    {(username ?? "?")[0].toUpperCase()}
                  </div>
                )}
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
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2" style={{ color: "var(--novae-text-secondary)" }}>
                      <span className="w-[22px] flex justify-center"><IconMail /></span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}>Messages</span>
                    </div>
                    <Badge count={1} />
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2" style={{ color: "var(--novae-text-secondary)" }}>
                      <span className="w-[22px] flex justify-center"><IconBell /></span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}>Notifications</span>
                    </div>
                    <Badge count={30} />
                  </div>

                  <Divider />

                  {/* Theme toggle */}
                  <div className="flex items-center gap-3">
                    <span style={{ color: isDark ? "var(--novae-text-secondary)" : "var(--novae-text-primary)" }}><IconSun /></span>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-pointer"
                      style={{ backgroundColor: "var(--novae-outline-all)" }}
                      onClick={toggleTheme}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 size-4 rounded-full transition-transform"
                        style={{ backgroundColor: "var(--novae-btn-primary)", transform: isDark ? "translateX(18px)" : "translateX(0px)" }}
                      />
                    </div>
                    <span style={{ color: isDark ? "var(--novae-text-primary)" : "var(--novae-text-secondary)" }}><IconMoon /></span>
                  </div>

                  <Divider />

                  {/* Settings */}
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 w-full transition-opacity hover:opacity-70"
                    style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                  >
                    <span className="w-[22px] flex justify-center" style={{ color: "var(--novae-text-secondary)" }}><IconSettings /></span>
                    {t.navSettings}
                  </Link>

                  {/* Locale toggle */}
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: locale === "en" ? "var(--novae-text-primary)" : "var(--novae-text-secondary)" }}>EN</span>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-pointer"
                      style={{ backgroundColor: "var(--novae-outline-all)" }}
                      onClick={toggleLocale}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 size-4 rounded-full transition-transform"
                        style={{ backgroundColor: "var(--novae-btn-primary)", transform: locale === "fr" ? "translateX(18px)" : "translateX(0px)" }}
                      />
                    </div>
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: locale === "fr" ? "var(--novae-text-primary)" : "var(--novae-text-secondary)" }}>FR</span>
                  </div>

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
              className="font-medium transition-opacity hover:opacity-70"
              style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)" }}
            >
              {t.navLogin}
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center px-5 py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90"
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
  );
}
