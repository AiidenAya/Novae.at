"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
      <span style={{
        fontFamily: "var(--font-space-grotesk)",
        fontSize: "var(--novae-text-sm)",
        fontWeight: 400,
        color: "var(--novae-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.35em",
        display: "block",
      }}>
        {children}
      </span>
      <div style={{ height: 1, backgroundColor: "var(--novae-outline-all)" }} />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "var(--novae-bg-card)",
      border: "1px solid var(--novae-outline-all)",
      borderRadius: "var(--novae-radius-md)",
      padding: "var(--novae-space-3xl)",
      display: "flex", flexDirection: "column",
      gap: "var(--novae-space-2xl)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", margin: 0 }}>{hint}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(25,32,46,0.5)",
  border: "1px solid var(--novae-outline-all)",
  borderRadius: "var(--novae-radius-md)",
  padding: "12px 16px",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-base)",
  fontWeight: 500,
  color: "var(--novae-text-primary)",
  outline: "none",
  boxSizing: "border-box" as const,
};

// ── Social row ────────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = ["ArtFight", "Bluesky", "DeviantArt", "Discord", "FurAffinity", "Instagram", "Tumblr", "Twitter", "Custom link"];

function SocialRow({ platform, value, onChange, onRemove }: { platform: string; value: string; onChange: (v: string) => void; onRemove: () => void }) {
  return (
    <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "center" }}>
      <div style={{ width: 140, flexShrink: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)" }}>
        {platform}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="@username"
        style={{ ...inputStyle, flex: 1 }}
      />
      <button
        onClick={onRemove}
        style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--novae-text-secondary)", flexShrink: 0 }}
      >
        <IconX />
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EditProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { username } = React.use(params);
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    displayName: "Aiiden",
    username: "aiidenaya",
    pronouns: "She/They",
    bio: "Aiiden ☆ Artist & Designer ☆ They/Them ☆ \n🎨 Based in France ☆ \n✨ Creating art inspired by many artists ☆ \n📸 Follow for creative projects, design tips & vibrant visuals\n💌 Commissions open: aiidentravels@example.com",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&q=80",
    avatarImage: null as string | null,
  });

  const [socials, setSocials] = useState<{ platform: string; value: string }[]>([
    { platform: "ArtFight",   value: "@username" },
    { platform: "Bluesky",    value: "@username" },
    { platform: "Discord",    value: "@username" },
    { platform: "Instagram",  value: "@username" },
    { platform: "Twitter",    value: "@username" },
  ]);

  const [addPlatform, setAddPlatform] = useState("");

  function addSocial() {
    if (!addPlatform || socials.find((s) => s.platform === addPlatform)) return;
    setSocials((prev) => [...prev, { platform: addPlatform, value: "" }]);
    setAddPlatform("");
  }

  function removeSocial(i: number) {
    setSocials((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateSocial(i: number, value: string) {
    setSocials((prev) => prev.map((s, idx) => idx === i ? { ...s, value } : s));
  }

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "var(--novae-bg-main)" }}>
      {/* Background blur */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.15, filter: "blur(6px)", backgroundImage: `url(${form.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-lg)", marginBottom: "var(--novae-space-3xl)" }}>
          <button
            onClick={() => router.back()}
            style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-xs)", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 16px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)" }}
          >
            <IconChevronLeft />
            Back
          </button>
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 800, color: "var(--novae-text-primary)", margin: 0 }}>
            Edit Profile
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          {/* Cover + Avatar */}
          <Card>
            <SectionTitle>Appearance</SectionTitle>

            {/* Cover preview */}
            <Field label="Cover Image">
              <div style={{ position: "relative", width: "100%", height: 160, borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)", cursor: "pointer" }} onClick={() => coverRef.current?.click()}>
                {form.coverImage && <img src={form.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)", opacity: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "white" }}>
                    <IconCamera />
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500 }}>Change cover</span>
                  </div>
                </div>
              </div>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} />
            </Field>

            {/* Avatar preview */}
            <Field label="Avatar">
              <div style={{ display: "flex", gap: "var(--novae-space-lg)", alignItems: "center" }}>
                <div
                  style={{ width: 100, height: 100, borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "2px solid var(--novae-outline-all)", cursor: "pointer", position: "relative", backgroundColor: "rgba(105,61,169,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  onClick={() => avatarRef.current?.click()}
                >
                  {form.avatarImage
                    ? <img src={form.avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: 36, fontWeight: 700, color: "var(--novae-text-link)" }}>A</span>
                  }
                </div>
                <button
                  onClick={() => avatarRef.current?.click()}
                  style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-sm)", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: "pointer", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}
                >
                  <IconCamera />
                  Upload avatar
                </button>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} />
              </div>
            </Field>
          </Card>

          {/* Identity */}
          <Card>
            <SectionTitle>Identity</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--novae-space-lg)" }}>
              <Field label="Display name">
                <input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Username">
                <input value={form.username} onChange={(e) => set("username", e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Pronouns" hint="Shown next to your name on your profile.">
              <input value={form.pronouns} onChange={(e) => set("pronouns", e.target.value)} placeholder="She/They" style={inputStyle} />
            </Field>
            <Field label="Biography">
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </Field>
          </Card>

          {/* Socials */}
          <Card>
            <SectionTitle>Socials</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
              {socials.map((s, i) => (
                <SocialRow key={s.platform} platform={s.platform} value={s.value} onChange={(v) => updateSocial(i, v)} onRemove={() => removeSocial(i)} />
              ))}
            </div>

            {/* Add social */}
            <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "center" }}>
              <select
                value={addPlatform}
                onChange={(e) => setAddPlatform(e.target.value)}
                style={{ ...inputStyle, flex: 1, cursor: "pointer" }}
              >
                <option value="">Add a platform…</option>
                {SOCIAL_PLATFORMS.filter((p) => !socials.find((s) => s.platform === p)).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={addSocial}
                disabled={!addPlatform}
                style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-xs)", backgroundColor: addPlatform ? "var(--novae-btn-primary)" : "rgba(105,61,169,0.2)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "12px 20px", cursor: addPlatform ? "pointer" : "not-allowed", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, flexShrink: 0 }}
              >
                <IconPlus />
                Add
              </button>
            </div>
          </Card>

          {/* Save / Cancel */}
          <div style={{ display: "flex", gap: "var(--novae-space-md)", justifyContent: "flex-end" }}>
            <button
              onClick={() => router.back()}
              style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "12px 28px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: "var(--novae-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => router.back()}
              style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "12px 28px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: "var(--novae-text-btn)" }}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
