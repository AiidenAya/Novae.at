"use client";

import { useTheme } from "@/lib/use-theme";
import { useLocaleContext } from "@/lib/locale-context";
import { useT } from "@/lib/locale-context";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>{title}</h2>
      <div style={{ backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-3xl)", display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function OptionCard({ label, description, selected, onClick }: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4,
        padding: "14px 16px", cursor: "pointer", textAlign: "left",
        backgroundColor: selected ? "rgba(105,61,169,0.12)" : "rgba(25,32,46,0.4)",
        border: selected ? "1.5px solid var(--novae-outline-selected)" : "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-md)",
        flex: 1,
        transition: "border-color 0.15s, background-color 0.15s",
      }}
    >
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>{description}</span>
    </button>
  );
}

export default function AppearanceSettingsPage() {
  const { isDark, toggle } = useTheme();
  const { locale, toggle: toggleLocale } = useLocaleContext();
  const { t } = useT();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: "0 0 4px 0" }}>{t.appearance}</h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0 }}>{t.appearanceDesc}</p>
      </div>

      <Section title={t.appearanceTheme}>
        <div style={{ display: "flex", gap: 12 }}>
          <OptionCard label={t.appearanceDark} description={t.appearanceDarkDesc} selected={isDark} onClick={() => !isDark && toggle()} />
          <OptionCard label={t.appearanceLight} description={t.appearanceLightDesc} selected={!isDark} onClick={() => isDark && toggle()} />
        </div>
      </Section>

      <Section title={t.appearanceLanguage}>
        <div style={{ display: "flex", gap: 12 }}>
          <OptionCard label="English" description="Interface in English." selected={locale === "en"} onClick={() => locale !== "en" && toggleLocale()} />
          <OptionCard label="Français" description="Interface en français." selected={locale === "fr"} onClick={() => locale !== "fr" && toggleLocale()} />
        </div>
      </Section>
    </div>
  );
}
