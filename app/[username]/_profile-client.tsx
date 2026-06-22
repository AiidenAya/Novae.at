"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useUploadThing } from "@/lib/uploadthing-client";
import dynamic from "next/dynamic";

import {
  Card, SectionTitle, Avatar, SocialIcon,
  IconPencil, IconBook, IconUser, IconGlobe, IconPalette, IconUsers,
} from "./_shared";
import { MOCK_PROFILE, MOCK_ARTWORKS, ALL_MOCK_CHARACTERS, ALL_MOCK_WORLDS, MOCK_CHARACTER_FOLDERS, MOCK_WORLD_FOLDERS } from "./_mock-data";
import type { Profile } from "./_mock-data";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "creations" | "social" | "characters" | "worlds" | "artworks";

type EditState = {
  displayName: string;
  pronouns: string;
  bio: string;
  coverImage: string;
  avatarImage: string | null;
  socials: Profile["socials"];
  characters: Profile["characters"];
  worlds: Profile["worlds"];
  featuredFriends: Profile["featuredFriends"];
};

function socialUrl(name: string, handle: string): string | null {
  const h = handle.replace(/^@/, "");
  if (!h || h === "username") return null;
  switch (name) {
    case "ArtFight":    return `https://artfight.net/~${h}`;
    case "Bluesky":     return `https://bsky.app/profile/${h}`;
    case "DeviantArt":  return `https://www.deviantart.com/${h}`;
    case "FurAffinity": return `https://www.furaffinity.net/user/${h}`;
    case "Instagram":   return `https://www.instagram.com/${h}`;
    case "Tumblr":      return `https://${h}.tumblr.com`;
    case "Twitter":     return `https://x.com/${h}`;
    case "Custom link": return handle.startsWith("http") ? handle : null;
    default:            return null;
  }
}

// ── Lazy tabs (only Creations in initial bundle) ───────────────────────────────

import CreationsTab from "./_tabs/creations";

const CharactersTab = dynamic(() => import("./_tabs/characters"));
const WorldsTab     = dynamic(() => import("./_tabs/worlds"));
const SocialTab     = dynamic(() => import("./_tabs/social"));
const ArtworksTab   = dynamic(() => import("./_tabs/artworks"));

// ── Inline input style ────────────────────────────────────────────────────────

const inlineInput: React.CSSProperties = {
  background: "var(--novae-bg-input)",
  border: "1px solid var(--novae-outline-all)",
  borderRadius: "var(--novae-radius-md)",
  outline: "none",
  color: "var(--novae-text-primary)",
  fontFamily: "var(--font-dm-sans)",
  padding: "6px 12px",
  fontSize: "var(--novae-text-base)",
  width: "100%",
  boxSizing: "border-box" as const,
};

const addBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6,
  background: "none", border: "1px dashed var(--novae-outline-all)",
  borderRadius: "var(--novae-radius-md)", padding: "6px 14px",
  cursor: "pointer", color: "var(--novae-text-secondary)",
  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
};

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({
  profile, dbStats, isEditing, editState, setEditState,
}: {
  profile: Profile;
  dbStats: { followers: number; artworks: number; characters: number; worlds: number } | null;
  isEditing: boolean;
  editState: EditState;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
}) {
  const stats = {
    followers:  dbStats?.followers  ?? 0,
    artworks:   dbStats?.artworks   ?? 0,
    characters: dbStats?.characters ?? 0,
    worlds:     dbStats?.worlds     ?? 0,
  };

  const socials = isEditing ? editState.socials : profile.socials;

  const DEFAULT_HANDLE = "@username";
  function isSet(handle: string, name?: string) {
    if (!handle || handle === DEFAULT_HANDLE) return false;
    if (name === "Custom link" && handle === "custom link") return false;
    return true;
  }

  function updateHandle(name: string, handle: string) {
    setEditState((p) => ({ ...p, socials: p.socials.map((s) => s.name === name ? { ...s, handle } : s) }));
  }

  const visibleSocials = isEditing ? socials : socials.filter((s) => isSet(s.handle, s.name));

  return (
    <div className="profile-sidebar">
      <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Statistics</SectionTitle>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--novae-space-xs)" }}>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{val}</span>
              <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{key}</span>
            </div>
          ))}
        </div>
      </Card>

      {(isEditing || visibleSocials.length > 0) && <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Socials</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-md)" }}>
          {visibleSocials.map((s) => (
            <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: "var(--novae-space-sm)", alignItems: "center", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 500, flexShrink: 0, width: 110 }}>
                <SocialIcon name={s.name} />
                {s.name}
              </div>
              {isEditing ? (
                <input
                  value={isSet(s.handle, s.name) ? s.handle : ""}
                  placeholder={s.name === "Custom link" ? "https://..." : `Your ${s.name} handle`}
                  onChange={(e) => updateHandle(s.name, e.target.value || (s.name === "Custom link" ? "custom link" : DEFAULT_HANDLE))}
                  style={{ ...inlineInput, padding: "5px 10px" }}
                />
              ) : (() => {
                const url = s.link ? socialUrl(s.name, s.handle) : null;
                return url
                  ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-link)", fontStyle: "italic", fontWeight: 500, textDecoration: "none" }}>{s.handle}</a>
                  : <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-link)", fontStyle: "italic", fontWeight: 500 }}>{s.handle}</span>;
              })()}
            </div>
          ))}
        </div>
      </Card>}

      <Card style={{ padding: "var(--novae-space-2xl)" }}>
        <SectionTitle>Latest Forum Post</SectionTitle>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-secondary)", margin: 0, fontStyle: "italic" }}>
          No posts yet.
        </p>
      </Card>
    </div>
  );
}

// ── Profile header ─────────────────────────────────────────────────────────────

const COVER_HEIGHT  = 220;
const AVATAR_SIZE   = 200;
const COVER_OVERLAP = Math.round(AVATAR_SIZE * 0.25);

function CrownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--novae-text-tag)" stroke="none" aria-label="Admin">
      <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z"/>
      <path d="M5 20h14" stroke="var(--novae-text-tag)" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function ProfileHeader({
  profile, isOwner, isAdmin, isEditing, editState, setEditState, onEdit, onSave, onCancel, onUploadingChange, isUploading,
}: {
  profile: Profile;
  isOwner: boolean;
  isAdmin: boolean;
  isEditing: boolean;
  editState: EditState;
  setEditState: React.Dispatch<React.SetStateAction<EditState>>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUploadingChange: (v: boolean) => void;
  isUploading: boolean;
}) {
  const coverRef  = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover,  setUploadingCover]  = useState(false);

  const { startUpload: uploadAvatar } = useUploadThing("profileAvatar");
  const { startUpload: uploadCover  } = useUploadThing("profileCover");

  const coverImage  = isEditing ? editState.coverImage  : profile.coverImage;
  const avatarImage = isEditing ? editState.avatarImage : profile.avatarImage;

  async function handleFile(key: "coverImage" | "avatarImage", file: File | undefined) {
    if (!file) return;
    onUploadingChange(true);
    const preview = URL.createObjectURL(file);

    if (key === "avatarImage") {
      const prev = editState.avatarImage;
      setEditState((p) => ({ ...p, avatarImage: preview }));
      setUploadingAvatar(true);
      try {
        const res = await uploadAvatar([file]);
        setEditState((p) => ({ ...p, avatarImage: res?.[0]?.url ?? prev }));
      } catch {
        setEditState((p) => ({ ...p, avatarImage: prev }));
      }
      setUploadingAvatar(false);
    } else {
      const prev = editState.coverImage;
      setEditState((p) => ({ ...p, coverImage: preview }));
      setUploadingCover(true);
      try {
        const res = await uploadCover([file]);
        setEditState((p) => ({ ...p, coverImage: res?.[0]?.url ?? prev }));
      } catch {
        setEditState((p) => ({ ...p, coverImage: prev }));
      }
      setUploadingCover(false);
    }
    onUploadingChange(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <div style={{ backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden", paddingBottom: "var(--novae-space-3xl)" }}>
        {/* Cover */}
        <div
          style={{ width: "100%", height: COVER_HEIGHT, position: "relative", flexShrink: 0, cursor: isEditing ? "pointer" : "default" }}
          onClick={() => isEditing && coverRef.current?.click()}
        >
          {coverImage
            ? <img src={coverImage} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(105,61,169,0.4), rgba(164,132,220,0.2))" }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 35%, var(--novae-bg-main) 100%)", pointerEvents: "none" }} />
          {isEditing && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "white", fontWeight: 500 }}>
                {uploadingCover ? "Uploading…" : "Click to change cover"}
              </span>
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile("coverImage", e.target.files?.[0])} suppressHydrationWarning />
        </div>

        {/* Avatar row */}
        <div style={{ padding: "0 var(--novae-space-3xl)", marginTop: -COVER_OVERLAP, display: "flex", gap: "var(--novae-space-2xl)", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
          <div
            style={{ width: AVATAR_SIZE, height: AVATAR_SIZE, flexShrink: 0, border: "2px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden", position: "relative", cursor: isEditing ? "pointer" : "default" }}
            onClick={() => isEditing && avatarRef.current?.click()}
          >
            <Avatar src={avatarImage} size={AVATAR_SIZE} name={isEditing ? editState.displayName : profile.displayName} />
            {isEditing && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "white", fontWeight: 500, textAlign: "center", padding: "0 8px" }}>
                  {uploadingAvatar ? "Uploading…" : "Change avatar"}
                </span>
              </div>
            )}
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile("avatarImage", e.target.files?.[0])} suppressHydrationWarning />
          </div>

          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-end", minWidth: 0, paddingTop: 16, paddingBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)", flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-sm)" }}>
                  <input
                    value={editState.displayName}
                    onChange={(e) => setEditState((p) => ({ ...p, displayName: e.target.value }))}
                    style={{ ...inlineInput, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700 }}
                  />
                  <input
                    value={editState.pronouns}
                    onChange={(e) => setEditState((p) => ({ ...p, pronouns: e.target.value }))}
                    placeholder="Pronouns"
                    style={{ ...inlineInput }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-md)", padding: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0, whiteSpace: "nowrap" }}>
                      {profile.displayName}
                    </h1>
                    {isAdmin && <CrownIcon />}
                  </div>
                  {profile.pronouns && (
                    <span style={{ backgroundColor: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", borderRadius: "var(--novae-radius-sm)", padding: "4px 12px", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-tag)", whiteSpace: "nowrap" }}>
                      {profile.pronouns}
                    </span>
                  )}
                </div>
              )}
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: "var(--novae-text-primary)", margin: 0 }}>
                @{profile.username}
              </p>
            </div>

            {isOwner && !isEditing && (
              <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-sm)", backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "12px 20px", cursor: "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, flexShrink: 0 }}>
                <IconPencil /> Edit
              </button>
            )}
            {isEditing && (
              <div style={{ display: "flex", gap: "var(--novae-space-sm)" }}>
                <button onClick={onCancel} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: "pointer", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500 }}>
                  Cancel
                </button>
                <button onClick={onSave} disabled={isUploading} style={{ backgroundColor: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: isUploading ? "not-allowed" : "pointer", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, opacity: isUploading ? 0.6 : 1 }}>
                  {isUploading ? "Uploading…" : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biography */}
      <Card>
        <SectionTitle>Biography</SectionTitle>
        {isEditing ? (
          <textarea
            value={editState.bio}
            onChange={(e) => setEditState((p) => ({ ...p, bio: e.target.value }))}
            rows={5}
            style={{ ...inlineInput, resize: "vertical", fontFamily: "var(--font-dm-sans)", lineHeight: "1.6" }}
          />
        ) : (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 500, color: "var(--novae-text-primary)", lineHeight: "18px", whiteSpace: "pre-line", margin: 0 }}>
            {profile.bio}
          </p>
        )}
      </Card>
    </div>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "creations",  label: "Creations",  icon: <IconBook /> },
  { id: "social",     label: "Social",     icon: <IconUsers /> },
  { id: "characters", label: "Characters", icon: <IconUser /> },
  { id: "worlds",     label: "Worlds",     icon: <IconGlobe /> },
  { id: "artworks",   label: "Artworks",   icon: <IconPalette /> },
];

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: "flex", backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
      {TABS.map((tab) => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{ display: "flex", alignItems: "center", gap: "var(--novae-space-sm)", padding: "20px 32px", background: "none", border: "none", borderBottom: active === tab.id ? "2px solid var(--novae-outline-selected)" : "2px solid transparent", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 500, color: active === tab.id ? "var(--novae-text-primary)" : "var(--novae-text-secondary)" }}>
          {tab.icon}{tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Profile client ─────────────────────────────────────────────────────────────

function makeEditState(p: Profile): EditState {
  return {
    displayName:    p.displayName,
    pronouns:       p.pronouns,
    bio:            p.bio,
    coverImage:     p.coverImage,
    avatarImage:    p.avatarImage,
    socials:        p.socials,
    characters:     p.characters,
    worlds:         [],
    featuredFriends: p.featuredFriends,
  };
}

type DbCharacter = { id?: string; numId?: number; slug?: string; name: string; hearts: number; images: number; coverImage: string | null; folderId?: string | null };
type DbFolder = { id: string; name: string };
type DbProfile = {
  name: string | null;
  bio: string | null;
  avatar: string | null;
  coverImage: string | null;
  pronouns: string | null;
  socials: Record<string, string> | null;
} | null;

export function ProfileClient({
  username,
  dbProfile,
  dbStats,
  dbCharacters,
  dbFolders = [],
  featuredCharacterIds = [],
  isOwner: isOwnerProp,
  isAdmin,
}: {
  username: string;
  dbProfile: DbProfile;
  dbStats: { followers: number; artworks: number; characters: number; worlds: number } | null;
  dbCharacters: DbCharacter[];
  dbFolders?: DbFolder[];
  featuredCharacterIds?: string[];
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const dbSocials = dbProfile?.socials
    ? MOCK_PROFILE.socials.map((s) => ({
        ...s,
        handle: (dbProfile.socials as Record<string, string>)[s.name] ?? s.handle,
      }))
    : MOCK_PROFILE.socials;

  const baseProfile = {
    ...MOCK_PROFILE,
    username:    username,
    displayName: dbProfile?.name       ?? MOCK_PROFILE.displayName,
    bio:         dbProfile?.bio        ?? "",
    pronouns:    dbProfile?.pronouns   ?? "",
    avatarImage: dbProfile?.avatar     ?? MOCK_PROFILE.avatarImage,
    coverImage:  dbProfile?.coverImage ?? MOCK_PROFILE.coverImage,
    socials:     dbSocials,
    worlds:          [] as Profile["worlds"],
    featuredFriends: [] as Profile["featuredFriends"],
  };

  const [profile, setProfile] = useState(baseProfile);
  const [activeTab, setActiveTab] = useState<Tab>("creations");
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>(() => makeEditState(baseProfile));
  const [isUploading, setIsUploading] = useState(false);

  const isOwner = isOwnerProp;

  const onEdit   = useCallback(() => { setEditState(makeEditState(profile)); setIsEditing(true); }, [profile]);
  const onCancel = useCallback(() => { setEditState(makeEditState(profile)); setIsEditing(false); }, [profile]);
  const onSave   = useCallback(async () => {
    const socialsMap = Object.fromEntries(editState.socials.map((s) => [s.name, s.handle]));
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:                 editState.displayName,
        bio:                  editState.bio,
        pronouns:             editState.pronouns,
        coverImage:           editState.coverImage,
        avatar:               editState.avatarImage,
        socials:              socialsMap,
        featuredCharacterIds: featuredChars.map((c) => c.id).filter(Boolean),
      }),
    });
    setProfile((p) => ({ ...p, ...editState }));
    setIsEditing(false);
    // Reload so the navbar picks up the updated avatar from the session
    window.location.reload();
  }, [editState]);

  const removeWorld  = useCallback((i: number) => setEditState((p) => ({ ...p, worlds: p.worlds.filter((_, idx) => idx !== i) })), []);
  const addWorld     = useCallback((w: Profile["worlds"][number]) => setEditState((p) => p.worlds.length < 6 ? { ...p, worlds: [...p.worlds, w] } : p), []);
  const removeFriend = useCallback((i: number) => setEditState((p) => ({ ...p, featuredFriends: p.featuredFriends.filter((_, idx) => idx !== i) })), []);
  const addFriend    = useCallback((f: Profile["featuredFriends"][number]) => setEditState((p) => ({ ...p, featuredFriends: [...p.featuredFriends, f] })), []);

  // Featured characters: subset of real DB characters chosen by the owner
  const [featuredChars, setFeaturedChars] = useState<DbCharacter[]>(
    () => featuredCharacterIds.flatMap((fid) => dbCharacters.find((c) => c.id === fid) ?? [])
  );
  const removeFeatured = useCallback((i: number) => setFeaturedChars((cs) => cs.filter((_, idx) => idx !== i)), []);
  const addFeatured    = useCallback((c: DbCharacter) => setFeaturedChars((cs) => cs.length < 6 ? [...cs, c] : cs), []);

  const worlds          = isEditing ? editState.worlds         : profile.worlds;
  const featuredFriends = isEditing ? editState.featuredFriends : profile.featuredFriends;

  // Characters tab: group by real folders, ungrouped as fallback folder
  const characterFolder = dbFolders.length > 0
    ? [
        ...dbFolders.map((f) => ({
          id: f.id,
          name: f.name,
          items: dbCharacters.filter((c) => c.folderId === f.id).map((c) => ({ numId: c.numId, slug: c.slug, name: c.name, hearts: c.hearts, images: c.images, coverImage: c.coverImage })),
        })),
        ...(dbCharacters.some((c) => !c.folderId) ? [{
          id: "ungrouped",
          name: "Ungrouped",
          items: dbCharacters.filter((c) => !c.folderId).map((c) => ({ numId: c.numId, slug: c.slug, name: c.name, hearts: c.hearts, images: c.images, coverImage: c.coverImage })),
        }] : []),
      ]
    : [{
        id: "all",
        name: "All characters",
        items: dbCharacters.map((c) => ({ numId: c.numId, slug: c.slug, name: c.name, hearts: c.hearts, images: c.images, coverImage: c.coverImage })),
      }];

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: "var(--novae-bg-main)" }}>
      <div className="profile-layout" style={{ position: "relative", zIndex: 1, width: "100%", padding: "32px", boxSizing: "border-box" }}>
        <div className="profile-main">
          <ProfileHeader
            profile={profile}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isEditing={isEditing}
            editState={editState}
            setEditState={setEditState}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
            onUploadingChange={setIsUploading}
            isUploading={isUploading}
          />
          <TabBar active={activeTab} onChange={setActiveTab} />
          {activeTab === "creations"  && <CreationsTab  characters={featuredChars} worlds={worlds} allCharacters={dbCharacters} allWorlds={[]} setActiveTab={setActiveTab} isEditing={isEditing} onRemoveCharacter={removeFeatured} onAddCharacter={addFeatured} onRemoveWorld={removeWorld} onAddWorld={addWorld} />}
          {activeTab === "characters" && <CharactersTab folders={characterFolder} isEditing={isEditing} />}
          {activeTab === "worlds"     && <WorldsTab     folders={[]} isEditing={isEditing} />}
          {activeTab === "social"     && <SocialTab     username={username} featuredFriends={featuredFriends} isOwner={isOwner} isEditing={isEditing} onRemoveFriend={removeFriend} onAddFriend={addFriend} />}
          {activeTab === "artworks"   && <ArtworksTab   artworks={MOCK_ARTWORKS} />}
        </div>
        <Sidebar
          profile={profile}
          dbStats={dbStats}
          isEditing={isEditing}
          editState={editState}
          setEditState={setEditState}
        />
      </div>
    </div>
  );
}
