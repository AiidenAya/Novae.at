"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Feather icons inline — stroke="currentColor"
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconBookOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

const TABS = [
  { key: "profile",       label: "Profile",       Icon: IconUser },
  { key: "story",         label: "Story",         Icon: IconBookOpen },
  { key: "relationships", label: "Relationships", Icon: IconHeart },
  { key: "gallery",       label: "Gallery",       Icon: IconImage },
  { key: "timeline",      label: "Timeline",      Icon: IconClock },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface CharacterMenuTabsProps {
  activeTab: TabKey;
}

export default function CharacterMenuTabs({ activeTab }: CharacterMenuTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex items-stretch rounded-[var(--novae-radius-md)] border overflow-x-auto shrink-0 w-full"
      style={{
        backgroundColor: "var(--novae-bg-card)",
        borderColor: "var(--novae-outline-all)",
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <Link
            key={key}
            href={`${pathname}?tab=${key}`}
            className="flex gap-2 items-center flex-1 justify-center px-4 py-4 border-b-2 transition-colors whitespace-nowrap min-w-0"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-base)",
              fontWeight: 500,
              color: isActive ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
              borderBottomColor: isActive ? "var(--novae-outline-selected)" : "transparent",
            }}
          >
            <Icon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
