"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  displayName: "Aiiden",
  username: "aiidenaya",
  pronouns: "She/They",
  bio: `Aiiden ☆ Artist & Designer ☆ They/Them ☆ \n🎨 Based in France ☆ \n✨ Creating art inspired by many artists ☆ \n📸 Follow for creative projects, design tips & vibrant visuals\n💌 Commissions open: aiidentravels@example.com`,
  coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1400&q=80",
  avatarImage: null as string | null,
  stats: { followers: 8, artworks: 2, characters: 5, worlds: 5 },
  socials: [
    { name: "ArtFight",    handle: "@username", href: "#" },
    { name: "Bluesky",     handle: "@username", href: "#" },
    { name: "DeviantArt",  handle: "@username", href: "#" },
    { name: "Discord",     handle: "@username", href: "#" },
    { name: "FurAffinity", handle: "@username", href: "#" },
    { name: "Instagram",   handle: "@username", href: "#" },
    { name: "Tumblr",      handle: "@username", href: "#" },
    { name: "Twitter",     handle: "@username", href: "#" },
    { name: "Custom link", handle: "custom link", href: "#" },
  ],
  latestForumPost: {
    title: "Chapter Update",
    body: "Just finished the latest chapter of my story. I'm excited to share it with you all and can't wait to hear your thoughts!",
  },
  characters: [
    { name: "Saphira Aishi", hearts: 2, images: 8, coverImage: null },
    { name: "Aiiden Mizune", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the character", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the character", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the character", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the character", hearts: 2, images: 6, coverImage: null },
  ],
  worlds: [
    { name: "Name of the world", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the world", hearts: 2, images: 6, coverImage: null },
    { name: "Name of the world", hearts: 2, images: 6, coverImage: null },
  ],
  featuredFriends: Array(8).fill({ username: "Username", avatar: null }),
  comments: [
    {
      id: 1,
      username: "Username",
      avatar: null,
      date: "10 Jun. 2026 · 21:08",
      text: "I kinda find the worlds pretty cooooool and all and uuh i kinda like it",
      replies: [],
    },
    {
      id: 2,
      username: "Username",
      avatar: null,
      date: "10 Jun. 2026 · 21:09",
      text: "Love the characters, especially Saphira !",
      replies: [
        {
          id: 3,
          username: "aiidenaya",
          avatar: null,
          date: "11 Jun. 2026 · 22:10",
          text: "Thank you so so much !! <3",
        },
      ],
    },
  ],
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconBook() {
  return (
    <svg width="14" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="22" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function IconPencil() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
}

// ── Social icons ───────────────────────────────────────────────────────────────

function SocialIcon({ name }: { name: string }) {
  const s: React.CSSProperties = { color: "var(--novae-text-secondary)", width: 14, height: 14, flexShrink: 0 };

  if (name === "ArtFight") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59-2.83 2.83 1.59 1.59L3 19v2h2l8.17-8.17 1.59 1.59 2.83-2.83L16 10.63z"/>
      <path d="M20.71 5.96c.39-.39.39-1.02 0-1.41l-1.26-1.26a1 1 0 0 0-1.41 0L16.2 5.13l2.67 2.67z"/>
    </svg>
  );
  if (name === "Bluesky") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.204-.659-.299-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
    </svg>
  );
  if (name === "DeviantArt") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.207 0l-3.823 7.279-.946-.64H5.793L4 8.8v5.36l1.307 2.08H4V22.4L5.793 24h9.645l.956-1.12V22l2.813 2H24V0h-4.793zM20 21.16l-1.97-2.08H14.8l-.12.08v1.04l-.12.12H7l-.12-.08V17l.12-.08h3.16l.12-.12v-.84l-.12-.12H6.16V8.24l.96-1.04H13l.12.08v.92l-.12.12h-2.8l-.12.12v.84l.12.12H15l.96-1.04V4.4l-.96-1.04H8l-.12-.08V2.16h6.76l.12.08v.92l.12.12L20 2.84V21.16z"/>
    </svg>
  );
  if (name === "Discord") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
  if (name === "FurAffinity") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <ellipse cx="5.5" cy="5" rx="1.8" ry="2.2"/>
      <ellipse cx="11" cy="3.2" rx="1.8" ry="2.2"/>
      <ellipse cx="16.5" cy="4" rx="1.8" ry="2.2"/>
      <ellipse cx="2.5" cy="10" rx="1.5" ry="2"/>
      <path d="M11 8c-4.5 0-8.5 3.5-7.5 8 .7 3.2 3 4 7.5 4s6.8-.8 7.5-4c1-4.5-3-8-7.5-8z"/>
    </svg>
  );
  if (name === "Instagram") return (
    <svg style={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
  if (name === "Tumblr") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.385h-2.367V6.115c3.783-1.374 5.011-4.65 5.23-6.467C10.695-.045 13.009 0 13.009 0v5.865h3.852v3.52h-3.866v7.585c.039 1.402.578 2.433 2.476 2.433 1.173 0 2.179-.573 2.179-.573l.99 3.374C17.74 22.64 16.477 24 14.563 24z"/>
    </svg>
  );
  if (name === "Twitter") return (
    <svg style={s} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
  return <IconLink />;
}

// ── Avatar placeholder ─────────────────────────────────────────────────────────

function Avatar({ src, size, name }: { src: string | null; size: number; name: string }) {
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, objectFit: "cover", borderRadius: "var(--novae-radius-md)", display: "block" }} />;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: "var(--novae-radius-md)",
      backgroundColor: "rgba(105,61,169,0.3)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35,
      color: "var(--novae-text-link)",
      fontFamily: "var(--font-space-grotesk)",
      fontWeight: 700,
    }}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

// ── Section title ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", width: "100%" }}>
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

// ── Character card ─────────────────────────────────────────────────────────────

function CharacterCard({ name, hearts, images, coverImage }: { name: string; hearts: number; images: number; coverImage: string | null }) {
  return (
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
            <IconHeart />
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{hearts}</span>
          </div>
          <div style={{ display: "flex", gap: "var(--novae-space-xs)", alignItems: "center", color: "var(--novae-text-secondary)" }}>
            <IconImage />
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{images}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card container ─────────────────────────────────────────────────────────────

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

// ── View all link ──────────────────────────────────────────────────────────────

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, fontStyle: "italic", color: "var(--novae-text-link)", textDecoration: "underline", whiteSpace: "nowrap", flexShrink: 0 }}>
      View all
    </Link>
  );
}

// ── Creations tab ──────────────────────────────────────────────────────────────

function CreationsTab({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Characters</SectionTitle>
          <ViewAll href="#" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
          {profile.characters.map((c, i) => <CharacterCard key={i} {...c} />)}
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Worlds</SectionTitle>
          <ViewAll href="#" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {profile.worlds.map((w, i) => <CharacterCard key={i} {...w} />)}
        </div>
      </Card>
    </div>
  );
}

// ── Characters tab ─────────────────────────────────────────────────────────────

function CharactersTab({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <Card>
      <SectionTitle>Characters</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {profile.characters.map((c, i) => <CharacterCard key={i} {...c} />)}
      </div>
    </Card>
  );
}

// ── Worlds tab ─────────────────────────────────────────────────────────────────

function WorldsTab({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <Card>
      <SectionTitle>Worlds</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {profile.worlds.map((w, i) => <CharacterCard key={i} {...w} />)}
      </div>
    </Card>
  );
}

// ── Comment ────────────────────────────────────────────────────────────────────

type CommentData = { id: number; username: string; avatar: null; date: string; text: string; replies?: CommentData[] };

function Comment({ comment }: { comment: CommentData }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
      <div style={{ display: "flex", gap: "var(--novae-space-md)", alignItems: "flex-start" }}>
        <Avatar src={comment.avatar} size={40} name={comment.username} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--novae-space-xs)" }}>
          <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{comment.username}</span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{comment.date}</span>
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)", lineHeight: "18px", margin: 0 }}>
            {comment.text}
          </p>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", textAlign: "left", padding: 0 }}>
            Reply
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 52, display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          {comment.replies.map((reply) => (
            <div key={reply.id} style={{ backgroundColor: "rgba(105,61,169,0.08)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-lg)" }}>
              <Comment comment={reply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Social tab ─────────────────────────────────────────────────────────────────

function SocialTab({ profile }: { profile: typeof MOCK_PROFILE }) {
  const [commentText, setCommentText] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Friends</SectionTitle>
          <ViewAll href="#" />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between" }}>
          {profile.featuredFriends.map((friend, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", alignItems: "center", width: 80 }}>
              <div style={{ width: 80, height: 80, borderRadius: "var(--novae-radius-md)", backgroundColor: "rgba(105,61,169,0.1)", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.15) 0% 25%, transparent 0% 50%)", backgroundSize: "12px 12px" }} />
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, color: "var(--novae-text-primary)", textAlign: "center" }}>{friend.username}</span>
            </div>
          ))}
        </div>
        <button style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
          View more ›
        </button>
      </Card>

      <Card>
        <SectionTitle>Comments</SectionTitle>
        <div style={{ border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 12px", borderBottom: "1px solid var(--novae-outline-all)", backgroundColor: "rgba(25,32,46,0.5)" }}>
            {["B", "I", "U", "S"].map((f) => (
              <button key={f} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: 13, width: 28, height: 28, borderRadius: 4 }}>{f}</button>
            ))}
          </div>
          <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." rows={3}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: "12px 16px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", resize: "vertical", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={{ backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>Post</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-3xl)" }}>
          {profile.comments.map((comment) => <Comment key={comment.id} comment={comment} />)}
        </div>
        <button style={{ alignSelf: "center", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 24px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
          View more ›
        </button>
      </Card>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ profile }: { profile: typeof MOCK_PROFILE }) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "var(--novae-space-lg)",
      position: "sticky",
      top: 32,
      alignSelf: "flex-start",
    }}>
      <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Statistics</SectionTitle>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {Object.entries(profile.stats).map(([key, val]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--novae-space-xs)" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{val}</span>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{key}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Socials</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          {profile.socials.map((s) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>
                <SocialIcon name={s.name} />
                {s.name}
              </div>
              <a href={s.href} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-link)", fontStyle: "italic", fontWeight: 500, textDecoration: "none" }}>
                {s.handle}
              </a>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Latest Forum Post</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
          <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-link)", margin: 0 }}>
            {profile.latestForumPost.title}
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-secondary)", lineHeight: "18px", margin: 0 }}>
            {profile.latestForumPost.body}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ── Profile header ─────────────────────────────────────────────────────────────

const COVER_HEIGHT  = 220;
const AVATAR_SIZE   = 200;
const COVER_OVERLAP = 130;

function ProfileHeader({ profile, username }: { profile: typeof MOCK_PROFILE; username: string }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      {/* Profile card */}
      <div style={{
        backgroundColor: "var(--novae-bg-card)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-md)",
        overflow: "hidden",
        paddingBottom: "var(--novae-space-3xl)",
      }}>
        {/* Cover — dark gradient at bottom so card bg extends visually upward into cover */}
        <div style={{ width: "100%", height: COVER_HEIGHT, position: "relative", flexShrink: 0 }}>
          {profile.coverImage
            ? <img src={profile.coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(105,61,169,0.4), rgba(164,132,220,0.2))" }} />
          }
          {/* gradient overlay — card bg bleeds up from bottom of cover */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 35%, var(--novae-bg-main) 100%)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Avatar row — climbs into cover via negative marginTop */}
        <div style={{
          padding: "0 var(--novae-space-3xl)",
          marginTop: -COVER_OVERLAP,
          display: "flex",
          gap: "var(--novae-space-2xl)",
          alignItems: "flex-end",
          position: "relative",
          zIndex: 1,
        }}>
          <div style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, border: "2px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
            <Avatar src={profile.avatarImage} size={AVATAR_SIZE} name={profile.displayName} />
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", minWidth: 0, paddingBottom: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-xs)" }}>
              <div style={{ display: "flex", gap: "var(--novae-space-2xl)", alignItems: "center" }}>
                <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0, whiteSpace: "nowrap" }}>
                  {profile.displayName}
                </h1>
                <span style={{ backgroundColor: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", borderRadius: "var(--novae-radius-sm)", padding: "4px 12px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-tag)", whiteSpace: "nowrap" }}>
                  {profile.pronouns}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: "var(--novae-text-primary)", margin: 0 }}>
                @{profile.username}
              </p>
            </div>
            <button
              onClick={() => router.push(`/${username}/edit`)}
              style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-sm)", backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "12px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, flexShrink: 0 }}
            >
              <IconPencil />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Biography */}
      <Card>
        <SectionTitle>Biography</SectionTitle>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)", lineHeight: "18px", whiteSpace: "pre-line", margin: 0 }}>
          {profile.bio}
        </p>
      </Card>
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

type Tab = "creations" | "characters" | "worlds" | "social";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "creations",  label: "Creations",  icon: <IconBook /> },
  { id: "characters", label: "Characters", icon: <IconUser /> },
  { id: "worlds",     label: "Worlds",     icon: <IconGlobe /> },
  { id: "social",     label: "Social",     icon: <IconUsers /> },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: "flex", alignItems: "center", gap: "var(--novae-space-sm)",
            padding: "20px 32px", background: "none", border: "none",
            borderBottom: active === tab.id ? "2px solid var(--novae-outline-selected)" : "2px solid transparent",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500,
            color: active === tab.id ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params);
  const profile = MOCK_PROFILE;
  const [activeTab, setActiveTab] = useState<Tab>("creations");

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "var(--novae-bg-main)" }}>
      {/* Background blur */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.2, filter: "blur(6px)", backgroundImage: `url(${profile.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" }} />

      {/* 3/4 + 1/4 layout */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", padding: "32px", display: "flex", gap: "var(--novae-space-3xl)", alignItems: "flex-start", boxSizing: "border-box" }}>
        {/* Main column — 3/4 */}
        <div style={{ flex: 3, minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
          <ProfileHeader profile={profile} username={username} />
          <TabBar active={activeTab} onChange={setActiveTab} />
          {activeTab === "creations"  && <CreationsTab  profile={profile} />}
          {activeTab === "characters" && <CharactersTab profile={profile} />}
          {activeTab === "worlds"     && <WorldsTab     profile={profile} />}
          {activeTab === "social"     && <SocialTab     profile={profile} />}
        </div>

        {/* Sidebar — 1/4, sticky */}
        <Sidebar profile={profile} />
      </div>
    </div>
  );
}
