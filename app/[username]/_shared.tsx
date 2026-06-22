"use client";

import React from "react";

// ── Icons ─────────────────────────────────────────────────────────────────────

export function IconBook() {
  return <svg width="14" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
}
export function IconUser() {
  return <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
export function IconGlobe() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
export function IconPalette() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>;
}
export function IconUsers() {
  return <svg width="22" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
export function IconHeart() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
}
export function IconImage() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
}
export function IconPencil() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
export function IconLink() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}

// ── Social icon ────────────────────────────────────────────────────────────────

export function SocialIcon({ name, size = 14 }: { name: string; size?: number }) {
  const s: React.CSSProperties = { color: "var(--novae-text-secondary)", width: size, height: size, flexShrink: 0 };
  if (name === "ArtFight")    return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59-2.83 2.83 1.59 1.59L3 19v2h2l8.17-8.17 1.59 1.59 2.83-2.83L16 10.63z"/><path d="M20.71 5.96c.39-.39.39-1.02 0-1.41l-1.26-1.26a1 1 0 0 0-1.41 0L16.2 5.13l2.67 2.67z"/></svg>;
  if (name === "Bluesky")     return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>;
  if (name === "DeviantArt")  return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.457 0H14.84l-2.617 5.886-1.35-.619H5.543L4 7.028v4.316l1.234 1.798H4V18.936l1.543 1.315h9.05l1.044-1.062v-.712l2.12 1.774H22V0h-3.543zm.493 18.53-1.993-2.56-.679-.638H14l-.749.75v.637l.749.744.679.008-.749 1.278v1.219H7.407l-.656-.5v-4.8l.656-.75h3.684l.656-.75v-.75l-.656-.75H7.407V6.82l.656-.75h6.543v.51l-.44.772h-.75l-.749.75v.75l.75.75h3.75l.75-1.5V4.858l-.75-.75H9.75L9 3.357V2.3h7.846l1.354 1.219v3.651l-1.354.75H14.5l-.75-.75v-.511l.75-.773h.75l.44-1.6V2.3H9.25L7.75 3.853v3.651l.75.75h3.75l.75.75v.75l-.75.75H7.75v5.8l1.5 1.427h8.089l1.499-1.427v-1.8l2.112 2.027z"/></svg>;
  if (name === "Discord")     return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>;
  if (name === "FurAffinity") return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><ellipse cx="5.5" cy="5" rx="1.8" ry="2.2"/><ellipse cx="11" cy="3.2" rx="1.8" ry="2.2"/><ellipse cx="16.5" cy="4" rx="1.8" ry="2.2"/><ellipse cx="2.5" cy="10" rx="1.5" ry="2"/><path d="M11 8c-4.5 0-8.5 3.5-7.5 8 .7 3.2 3 4 7.5 4s6.8-.8 7.5-4c1-4.5-3-8-7.5-8z"/></svg>;
  if (name === "Instagram")   return <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
  if (name === "Tumblr")      return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.385h-2.367V6.115c3.783-1.374 5.011-4.65 5.23-6.467C10.695-.045 13.009 0 13.009 0v5.865h3.852v3.52h-3.866v7.585c.039 1.402.578 2.433 2.476 2.433 1.173 0 2.179-.573 2.179-.573l.99 3.374C17.74 22.64 16.477 24 14.563 24z"/></svg>;
  if (name === "Twitter")     return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  return <IconLink />;
}

// ── UI primitives ─────────────────────────────────────────────────────────────

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-3xl)", display: "flex", flexDirection: "column", gap: "var(--novae-space-2xl)", ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", width: "100%" }}>
      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 400, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.35em", display: "block" }}>
        {children}
      </span>
      <div style={{ height: 1, width: "25%", backgroundColor: "var(--novae-outline-all)" }} />
    </div>
  );
}

export function Avatar({ src, size, name }: { src: string | null; size: number; name: string }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, objectFit: "cover", borderRadius: "var(--novae-radius-md)", display: "block" }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "var(--novae-radius-md)", backgroundColor: "#19202e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, color: "var(--novae-text-link)", fontFamily: "var(--font-space-grotesk)", fontWeight: 700 }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

export function CharacterCard({ name, hearts, images, coverImage, slug }: { name: string; hearts: number; images: number; coverImage: string | null; slug?: string }) {
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", width: 156, flexShrink: 0 }}>
      <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "var(--novae-radius-md)", overflow: "hidden", backgroundColor: "rgba(105,61,169,0.1)" }}>
        {coverImage
          ? <img src={coverImage} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.15) 0% 25%, transparent 0% 50%)", backgroundSize: "20px 20px" }} />
        }
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", alignItems: "center", width: "100%" }}>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: "var(--novae-text-link)", textAlign: "center", wordBreak: "break-word", width: "100%", margin: 0 }}>
          {name}
        </p>
        <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "var(--novae-space-xs)", alignItems: "center", color: "var(--novae-text-secondary)" }}>
            <IconHeart /><span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{hearts}</span>
          </div>
          <div style={{ display: "flex", gap: "var(--novae-space-xs)", alignItems: "center", color: "var(--novae-text-secondary)" }}>
            <IconImage /><span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{images}</span>
          </div>
        </div>
      </div>
    </div>
  );
  if (slug) return <a href={`/library/characters/${slug}`} style={{ textDecoration: "none" }}>{inner}</a>;
  return inner;
}

export const viewAllStyle: React.CSSProperties = { fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, fontStyle: "italic", color: "var(--novae-text-link)", textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0 };
