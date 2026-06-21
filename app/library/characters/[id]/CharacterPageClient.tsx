"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing-client";

// ─── Types ─────────────────────────────────────────────────────────────────

type Swatch = { id?: string; hex: string; label: string | null };
type Tag    = { tagId: string; tag: { id: string; name: string } };
type Artwork = { id: string; imageUrl: string; title: string | null };

interface CharacterData {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  birthdate: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  mbti: string | null;
  kingdom: string | null;
  voiceClaimUrl: string | null;
  createdAt: Date;
  isPublic: boolean;
  user: { username: string | null };
  artworks: Artwork[];
  tags: Tag[];
  colorPalettes: { id: string; swatches: Swatch[] }[];
  favorites: { id: string }[];
}

interface Props {
  character: CharacterData;
  isOwner: boolean;
  currentUserId: string | null;
}

// ─── Inline styles helpers ──────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--novae-bg-input)",
  border: "1px solid var(--novae-outline-selected)",
  borderRadius: "var(--novae-radius-md)",
  outline: "none",
  color: "var(--novae-text-primary)",
  fontFamily: "var(--font-dm-sans)",
  padding: "6px 10px",
  fontSize: "var(--novae-text-base)",
  width: "100%",
  boxSizing: "border-box" as const,
};

// ─── Small sub-components ───────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "var(--novae-bg-card)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-md)",
        padding: "var(--novae-space-xl)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--novae-space-lg)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontSize: "var(--novae-text-xs)",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "var(--novae-text-secondary)",
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
}

// ─── Color Picker popover ───────────────────────────────────────────────────

function ColorPickerPopover({
  swatch,
  onSave,
  onClose,
}: {
  swatch: Swatch;
  onSave: (s: Swatch) => void;
  onClose: () => void;
}) {
  const [hex, setHex] = useState(swatch.hex);
  const [label, setLabel] = useState(swatch.label ?? "");

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 50,
        top: "110%",
        left: 0,
        background: "var(--novae-bg-card)",
        border: "1px solid var(--novae-outline-all)",
        borderRadius: "var(--novae-radius-md)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 180,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} style={{ width: "100%", height: 48, border: "none", borderRadius: 6, cursor: "pointer" }} />
      <input
        placeholder="Label (e.g. Eyes)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onClose} style={{ flex: 1, padding: "6px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-secondary)", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Cancel</button>
        <button onClick={() => { onSave({ hex, label }); onClose(); }} style={{ flex: 1, padding: "6px 0", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-sm)", color: "#fff", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600 }}>Save</button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CharacterPageClient({ character, isOwner, currentUserId }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "gallery">("profile");

  // Edit state mirrors the DB fields
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description ?? "");
  const [birthdate, setBirthdate] = useState(character.birthdate ?? "");
  const [age, setAge] = useState(character.age ?? "");
  const [height, setHeight] = useState(character.height ?? "");
  const [weight, setWeight] = useState(character.weight ?? "");
  const [mbti, setMbti] = useState(character.mbti ?? "");
  const [kingdom, setKingdom] = useState(character.kingdom ?? "");
  const [voiceClaimUrl, setVoiceClaimUrl] = useState(character.voiceClaimUrl ?? "");
  const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl ?? "");

  // Tags
  const [tags, setTags] = useState<Tag[]>(character.tags);
  const [tagInput, setTagInput] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  // Palette
  const initialSwatches = character.colorPalettes[0]?.swatches ?? [];
  const [swatches, setSwatches] = useState<Swatch[]>(initialSwatches);
  const [editingSwatch, setEditingSwatch] = useState<number | null>(null);

  // Artworks
  const [artworks, setArtworks] = useState<Artwork[]>(character.artworks);
  const [uploadingImage, setUploadingImage] = useState(false);
  const artworkFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const { startUpload: startArtworkUpload } = useUploadThing("characterImage");
  const { startUpload: startAvatarUpload } = useUploadThing("characterAvatar");

  // Favorite
  const [favorited, setFavorited] = useState(
    character.favorites.some(() => false) // will be filled by server prop
  );
  const [favLoading, setFavLoading] = useState(false);

  // ── Save handler ──────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true);
    try {
      // Save character fields
      await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, birthdate, age, height, weight, mbti, kingdom, voiceClaimUrl, avatarUrl }),
      });

      // Save palette
      await fetch(`/api/characters/${character.id}/palette`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swatches }),
      });

      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }, [character.id, name, description, birthdate, age, height, weight, mbti, kingdom, voiceClaimUrl, avatarUrl, swatches, router]);

  const cancelEdit = () => {
    setName(character.name);
    setDescription(character.description ?? "");
    setBirthdate(character.birthdate ?? "");
    setAge(character.age ?? "");
    setHeight(character.height ?? "");
    setWeight(character.weight ?? "");
    setMbti(character.mbti ?? "");
    setKingdom(character.kingdom ?? "");
    setVoiceClaimUrl(character.voiceClaimUrl ?? "");
    setAvatarUrl(character.avatarUrl ?? "");
    setSwatches(initialSwatches);
    setEditing(false);
  };

  // ── Tag handlers ──────────────────────────────────────────────────────────

  const addTag = async () => {
    if (!tagInput.trim()) return;
    setAddingTag(true);
    try {
      const res = await fetch(`/api/characters/${character.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagInput.trim() }),
      });
      if (res.ok) {
        const tag = await res.json();
        const newCharTag: Tag = { tagId: tag.id, tag };
        setTags((prev) => [...prev.filter((t) => t.tagId !== tag.id), newCharTag]);
        setTagInput("");
      }
    } finally {
      setAddingTag(false);
    }
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/characters/${character.id}/tags/${tagId}`, { method: "DELETE" });
    setTags((prev) => prev.filter((t) => t.tagId !== tagId));
  };

  // ── Artwork upload ────────────────────────────────────────────────────────

  const uploadArtwork = async (files: File[], isAvatar = false) => {
    setUploadingImage(true);
    try {
      const uploaded = isAvatar
        ? await startAvatarUpload(files)
        : await startArtworkUpload(files);

      if (!uploaded?.length) return;

      if (isAvatar) {
        const url = uploaded[0].ufsUrl;
        setAvatarUrl(url);
        await fetch(`/api/characters/${character.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: url }),
        });
        router.refresh();
      } else {
        for (const file of uploaded) {
          const res = await fetch(`/api/characters/${character.id}/artworks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: file.ufsUrl, title: file.name.replace(/\.[^.]+$/, "") }),
          });
          if (res.ok) {
            const artwork = await res.json();
            setArtworks((prev) => [artwork, ...prev]);
          }
        }
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const deleteArtwork = async (artworkId: string) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`/api/characters/${character.id}/artworks/${artworkId}`, { method: "DELETE" });
    setArtworks((prev) => prev.filter((a) => a.id !== artworkId));
  };

  // ── Favorite ──────────────────────────────────────────────────────────────

  const toggleFavorite = async () => {
    if (!currentUserId) return;
    setFavLoading(true);
    try {
      const res = await fetch(`/api/characters/${character.id}/favorite`, { method: "POST" });
      if (res.ok) {
        const { favorited: f } = await res.json();
        setFavorited(f);
      }
    } finally {
      setFavLoading(false);
    }
  };

  // ── Palette ───────────────────────────────────────────────────────────────

  const addSwatch = () => {
    const newSwatch: Swatch = { hex: "#888888", label: "" };
    setSwatches((prev) => [...prev, newSwatch]);
    setEditingSwatch(swatches.length);
  };

  const updateSwatch = (i: number, updated: Swatch) => {
    setSwatches((prev) => prev.map((s, idx) => (idx === i ? updated : s)));
  };

  const removeSwatch = (i: number) => {
    setSwatches((prev) => prev.filter((_, idx) => idx !== i));
    setEditingSwatch(null);
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const displayAvatar = avatarUrl || artworks[0]?.imageUrl || null;
  const latestImages = artworks.slice(0, 4);

  const infoRows = [
    { label: "Birthdate", value: editing ? birthdate : character.birthdate, setter: setBirthdate },
    { label: "Age",       value: editing ? age       : character.age,       setter: setAge },
    { label: "Height",    value: editing ? height    : character.height,    setter: setHeight },
    { label: "Weight",    value: editing ? weight    : character.weight,    setter: setWeight },
    { label: "MBTI",      value: editing ? mbti      : character.mbti,      setter: setMbti },
    { label: "Kingdom",   value: editing ? kingdom   : character.kingdom,   setter: setKingdom },
  ];

  const TABS = [
    { key: "profile" as const, label: "Profile" },
    { key: "gallery" as const, label: "Gallery" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: "var(--novae-bg-main)" }}
    >
      {/* Hidden file inputs */}
      <input
        ref={artworkFileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) await uploadArtwork(files);
          e.target.value = "";
        }}
      />
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) await uploadArtwork(files, true);
          e.target.value = "";
        }}
      />

      <div className="relative flex gap-6 px-8 pt-8 w-full items-start">
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 min-w-0 pb-8" style={{ flex: "3 1 0" }}>

          {/* Header */}
          <div className="flex items-center justify-between gap-4 w-full">
            {/* Avatar */}
            <div
              className="relative shrink-0 rounded-[var(--novae-radius-lg)] overflow-hidden"
              style={{
                width: 280, height: 280,
                backgroundColor: "var(--novae-bg-card)",
                border: "1px solid var(--novae-outline-all)",
                cursor: isOwner ? "pointer" : "default",
              }}
              onClick={() => isOwner && avatarFileRef.current?.click()}
            >
              {displayAvatar ? (
                <Image src={displayAvatar} alt={name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ color: "var(--novae-text-secondary)" }}>
                  {isOwner ? (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>Add image</span>
                    </>
                  ) : (
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>No image</span>
                  )}
                </div>
              )}
              {isOwner && displayAvatar && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "#fff" }}>Change image</span>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex flex-col flex-1 min-w-0 min-h-[280px] items-end justify-between pl-6 pr-2 py-2">
              {/* Action buttons */}
              <div className="flex gap-3 items-center shrink-0">
                {!isOwner && currentUserId && (
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    style={{
                      display: "flex", gap: 8, alignItems: "center",
                      padding: "10px 20px",
                      background: favorited ? "rgba(220,50,50,0.15)" : "var(--novae-btn-secondary)",
                      border: `1px solid ${favorited ? "rgba(220,50,50,0.4)" : "var(--novae-outline-all)"}`,
                      borderRadius: "var(--novae-radius-md)",
                      color: favorited ? "#e05252" : "var(--novae-text-btn)",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-lg)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {favorited ? "Favorited" : "Favorite"}
                  </button>
                )}

                {isOwner && !editing && (
                  <>
                    <button
                      onClick={() => artworkFileRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        display: "flex", gap: 8, alignItems: "center",
                        padding: "10px 20px",
                        background: "var(--novae-btn-secondary)",
                        border: "1px solid var(--novae-outline-all)",
                        borderRadius: "var(--novae-radius-md)",
                        color: "var(--novae-text-btn)",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      {uploadingImage ? "Uploading…" : "Add image"}
                    </button>
                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        display: "flex", gap: 8, alignItems: "center",
                        padding: "10px 20px",
                        background: "var(--novae-btn-primary)",
                        border: "none",
                        borderRadius: "var(--novae-radius-md)",
                        color: "#fff",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Edit
                    </button>
                  </>
                )}

                {isOwner && editing && (
                  <>
                    <button
                      onClick={cancelEdit}
                      style={{
                        padding: "10px 20px",
                        background: "var(--novae-btn-secondary)",
                        border: "1px solid var(--novae-outline-all)",
                        borderRadius: "var(--novae-radius-md)",
                        color: "var(--novae-text-btn)",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      style={{
                        padding: "10px 24px",
                        background: "var(--novae-btn-primary)",
                        border: "none",
                        borderRadius: "var(--novae-radius-md)",
                        color: "#fff",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        fontWeight: 600,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>

              {/* Name + quote + meta */}
              <div className="flex flex-col gap-3 w-full">
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: "var(--novae-text-4xl)",
                      fontWeight: 700,
                      padding: "8px 12px",
                    }}
                  />
                ) : (
                  <h1
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: "var(--novae-text-4xl)",
                      fontWeight: 700,
                      color: "var(--novae-text-primary)",
                      margin: 0,
                    }}
                  >
                    {name}
                  </h1>
                )}

                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="A short quote or description…"
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-lg)",
                      fontStyle: "italic",
                      resize: "vertical",
                    }}
                  />
                ) : (
                  description && (
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        fontStyle: "italic",
                        color: "var(--novae-text-secondary)",
                        margin: 0,
                      }}
                    >
                      &ldquo;{description}&rdquo;
                    </p>
                  )
                )}

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap" as const,
                    gap: "24px",
                    paddingTop: 16,
                    borderTop: "1px solid var(--novae-outline-all)",
                    marginTop: 4,
                  }}
                >
                  <MetaItem label="Owner" value={`@${character.user.username}`} href={`/${character.user.username}`} />
                  <MetaItem label="Designer" value={`@${character.user.username}`} href={`/${character.user.username}`} />
                  <MetaItem
                    label="Created"
                    value={new Intl.DateTimeFormat("fr-FR").format(new Date(character.createdAt))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid var(--novae-outline-all)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid var(--novae-btn-primary)" : "2px solid transparent",
                  color: activeTab === tab.key ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "var(--novae-text-base)",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  cursor: "pointer",
                  marginBottom: -1,
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Profile */}
          {activeTab === "profile" && (
            <div className="flex gap-8 items-start w-full">
              {/* Left sub-sidebar */}
              <div className="flex flex-col gap-6 shrink-0" style={{ width: 260 }}>

                {/* Informations */}
                <SectionCard title="Informations">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {infoRows.map(({ label, value, setter }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-secondary)", width: "45%", flexShrink: 0 }}>
                          {label}
                        </span>
                        {editing ? (
                          <input
                            value={value ?? ""}
                            onChange={(e) => setter(e.target.value)}
                            placeholder="—"
                            style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                          />
                        ) : (
                          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>
                            {value || "—"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Voice Claim */}
                <SectionCard title="Voice Claim">
                  {editing ? (
                    <input
                      value={voiceClaimUrl}
                      onChange={(e) => setVoiceClaimUrl(e.target.value)}
                      placeholder="YouTube URL"
                      style={inputStyle}
                    />
                  ) : voiceClaimUrl ? (
                    <div style={{ borderRadius: "var(--novae-radius-md)", overflow: "hidden", aspectRatio: "16/9" }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYoutubeId(voiceClaimUrl)}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", border: "none" }}
                      />
                    </div>
                  ) : (
                    <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                      {isOwner ? "Add a YouTube URL to set a voice claim." : "No voice claim."}
                    </p>
                  )}
                </SectionCard>

                {/* Color Palette */}
                <SectionCard title="Color Palette">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {swatches.map((swatch, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <div
                          style={{
                            width: 80, height: 80,
                            borderRadius: "var(--novae-radius-md)",
                            backgroundColor: swatch.hex,
                            cursor: editing ? "pointer" : "default",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            padding: 4,
                          }}
                          onClick={() => editing && setEditingSwatch(editingSwatch === i ? null : i)}
                        >
                          {swatch.label && (
                            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "10px", background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: 4, padding: "2px 6px", textAlign: "center", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {swatch.label}
                            </span>
                          )}
                        </div>
                        {editing && editingSwatch === i && (
                          <ColorPickerPopover
                            swatch={swatch}
                            onSave={(updated) => updateSwatch(i, updated)}
                            onClose={() => setEditingSwatch(null)}
                          />
                        )}
                        {editing && (
                          <button
                            onClick={() => removeSwatch(i)}
                            style={{
                              position: "absolute", top: -6, right: -6,
                              width: 18, height: 18,
                              background: "#e05252", border: "none", borderRadius: "50%",
                              color: "#fff", cursor: "pointer", fontSize: 12,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              lineHeight: 1,
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}

                    {editing && (
                      <button
                        onClick={addSwatch}
                        style={{
                          width: 80, height: 80,
                          borderRadius: "var(--novae-radius-md)",
                          border: "2px dashed var(--novae-outline-all)",
                          background: "none",
                          color: "var(--novae-text-secondary)",
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        +
                      </button>
                    )}

                    {swatches.length === 0 && !editing && (
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                        No palette yet.
                      </p>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Main content area */}
              <div className="flex flex-col gap-6 flex-1 min-w-0">
                {/* Latest images */}
                <SectionCard title="Latest Images">
                  <div style={{ display: "flex", gap: 8 }}>
                    {latestImages.length > 0 ? latestImages.map((artwork) => (
                      <div
                        key={artwork.id}
                        style={{
                          flex: 1,
                          aspectRatio: "1",
                          borderRadius: "var(--novae-radius-md)",
                          overflow: "hidden",
                          backgroundColor: "var(--novae-bg-main)",
                          position: "relative",
                        }}
                      >
                        <Image src={artwork.imageUrl} alt={artwork.title ?? ""} fill className="object-cover" />
                      </div>
                    )) : Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1, aspectRatio: "1",
                          borderRadius: "var(--novae-radius-md)",
                          backgroundColor: "var(--novae-bg-main)",
                          border: "1px solid var(--novae-outline-all)",
                        }}
                      />
                    ))}
                  </div>
                  {artworks.length > 4 && (
                    <button
                      onClick={() => setActiveTab("gallery")}
                      style={{ alignSelf: "flex-end", background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}
                    >
                      View all ({artworks.length}) →
                    </button>
                  )}
                </SectionCard>

                {/* Add container placeholder */}
                {isOwner && (
                  <button
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      width: "100%", padding: 16,
                      borderRadius: "var(--novae-radius-md)",
                      border: "1px dashed var(--novae-outline-all)",
                      background: "none",
                      color: "var(--novae-text-secondary)",
                      fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add a container
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab: Gallery */}
          {activeTab === "gallery" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isOwner && (
                <button
                  onClick={() => artworkFileRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    alignSelf: "flex-start",
                    padding: "10px 20px",
                    background: "var(--novae-btn-primary)",
                    border: "none",
                    borderRadius: "var(--novae-radius-md)",
                    color: "#fff",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                    fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer",
                    opacity: uploadingImage ? 0.7 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  {uploadingImage ? "Uploading…" : "Add images"}
                </button>
              )}

              {artworks.length === 0 ? (
                <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
                  No images yet.{isOwner ? " Click “Add images” to get started." : ""}
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {artworks.map((artwork) => (
                    <div
                      key={artwork.id}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "var(--novae-radius-md)",
                        overflow: "hidden",
                        backgroundColor: "var(--novae-bg-card)",
                      }}
                    >
                      <Image src={artwork.imageUrl} alt={artwork.title ?? ""} fill className="object-cover" />
                      {isOwner && (
                        <button
                          onClick={() => deleteArtwork(artwork.id)}
                          style={{
                            position: "absolute", top: 6, right: 6,
                            width: 28, height: 28,
                            background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                            color: "#fff", cursor: "pointer", fontSize: 14,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: 0, transition: "opacity 0.15s",
                          }}
                          className="artwork-delete-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <aside
          style={{
            flex: "1 1 0",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            position: "sticky",
            top: "calc(72px + 2rem)",
            maxHeight: "calc(100vh - 72px - 2rem)",
            overflowY: "auto",
            paddingBottom: 32,
          }}
        >
          {/* Stats */}
          <SectionCard title="Statistics">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[
                { count: artworks.length, label: "images" },
                { count: 0, label: "relations" },
                { count: character.favorites.length, label: "favorites" },
                { count: 0, label: "entries" },
              ].map(({ count, label }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-2xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
                    {count}
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Tags */}
          <SectionCard title="Tags">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {tags.map(({ tagId, tag }) => (
                <span
                  key={tagId}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "4px 10px",
                    borderRadius: "var(--novae-radius-sm)",
                    border: "0.5px solid var(--novae-outline-tag)",
                    background: "var(--novae-bg-tag)",
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "var(--novae-text-sm)",
                    color: "var(--novae-text-tag)",
                  }}
                >
                  #{tag.name}
                  {editing && (
                    <button
                      onClick={() => removeTag(tagId)}
                      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, fontSize: 14 }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}

              {editing && (
                <div style={{ display: "flex", gap: 4, width: "100%" }}>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add a tag…"
                    style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1 }}
                    disabled={addingTag}
                  />
                  <button
                    onClick={addTag}
                    disabled={addingTag || !tagInput.trim()}
                    style={{
                      padding: "6px 12px",
                      background: "var(--novae-btn-primary)", border: "none",
                      borderRadius: "var(--novae-radius-md)",
                      color: "#fff", cursor: "pointer",
                      fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                      opacity: !tagInput.trim() ? 0.5 : 1,
                    }}
                  >
                    +
                  </button>
                </div>
              )}

              {tags.length === 0 && !editing && (
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", margin: 0 }}>
                  No tags yet.
                </p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>

      {/* Hover show delete button on artwork */}
      <style>{`
        .artwork-delete-btn { opacity: 0 !important; }
        div:hover > .artwork-delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function MetaItem({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      {href ? (
        <a href={href} style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-link)", fontWeight: 700, fontStyle: "italic" }}>
          {value}
        </a>
      ) : (
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-link)", fontWeight: 700, fontStyle: "italic" }}>
          {value}
        </span>
      )}
    </div>
  );
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match?.[1] ?? "";
}
