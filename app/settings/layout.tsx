"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/settings/account",    label: "Account" },
  { href: "/settings/appearance", label: "Appearance" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="settings-layout" style={{ display: "flex", minHeight: "100%", padding: "48px 32px", gap: 40, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {/* Sidebar */}
      <aside className="settings-sidebar" style={{ width: 200, flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", fontWeight: 400, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.35em", margin: "0 0 12px 0" }}>
          Settings
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "block", padding: "9px 14px",
                  borderRadius: "var(--novae-radius-md)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500,
                  color: active ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
                  backgroundColor: active ? "rgba(105,61,169,0.12)" : "transparent",
                  textDecoration: "none",
                  transition: "background-color 0.15s, color 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
