"use client";

import { useRouter } from "next/navigation";

const CHOICES = [
  {
    id: "character",
    label: "Character",
    description: "Create an original character with a profile, gallery, and lore.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: "world",
    label: "World",
    description: "Build a world, setting or universe for your characters to live in.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    id: "image",
    label: "Image",
    description: "Upload a single artwork or illustration to your gallery.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    id: "multi-image",
    label: "Multi Image",
    description: "Upload multiple artworks at once and organize them together.",
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="14" height="14" rx="2"/><rect x="3" y="3" width="14" height="14" rx="2" fill="var(--novae-bg-card)"/>
        <circle cx="7.5" cy="7.5" r="1"/><polyline points="17 13 13 9 6 17"/>
      </svg>
    ),
  },
];

export default function NewPage() {
  const router = useRouter();

  function handleChoice(id: string) {
    // TODO: route to individual creation forms
    router.push(`/library/new/${id}`);
  }

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 32px" }}>
      <div style={{ width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
            Create new
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)", margin: 0 }}>
            What would you like to add to your library?
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {CHOICES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleChoice(c.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20,
                padding: "var(--novae-space-3xl)",
                backgroundColor: "var(--novae-bg-card)",
                border: "1px solid var(--novae-outline-all)",
                borderRadius: "var(--novae-radius-md)",
                cursor: "pointer", textAlign: "left",
                transition: "border-color 0.15s, background-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--novae-outline-selected)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(105,61,169,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--novae-outline-all)";
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--novae-bg-card)";
              }}
            >
              <div style={{ color: "var(--novae-text-link)", padding: 12, backgroundColor: "rgba(105,61,169,0.12)", borderRadius: "var(--novae-radius-sm)" }}>
                {c.icon}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
                  {c.label}
                </span>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", lineHeight: "1.5" }}>
                  {c.description}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
