"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const EditorField    = dynamic(() => import("@/components/editor/EditorField"),    { ssr: false });
const EditorRenderer = dynamic(() => import("@/components/editor/EditorRenderer"), { ssr: false });
import { useUploadThing } from "@/lib/uploadthing-client";
import { thumbUrl } from "@/lib/thumb";
import { characterUrl } from "@/lib/character-url";
import { useT } from "@/lib/locale-context";
import ImageCropModal from "@/components/ImageCropModal";
import SensitiveImageWrapper, { SensitiveBadge } from "@/components/SensitiveImageWrapper";
import { NovaeUserSearch } from "@/components/ui/NovaeUserSearch";
import { ArtworkCreditsDisplay, type ArtworkCreditData } from "@/components/ui/ArtworkCreditsDisplay";
import { ArtworkCreditsEditor, creditsValid, emptyCredit, type CreditDraft } from "@/components/ui/ArtworkCreditsEditor";
import { TagSearch } from "@/components/ui/TagSearch";

// ─── Types ─────────────────────────────────────────────────────────────────

type Swatch = { id?: string; hex: string; label: string | null };
type Tag    = { tagId: string; tag: { id: string; name: string } };
type Artwork = { id: string; imageUrl: string; thumbnailUrl: string | null; sensitiveType: string | null; characters: { id: string; name: string; numId: number; slug: string }[]; credits: ArtworkCreditData[] };

type RawCredit = { id: string; userId: string | null; label: string | null; url: string | null; user: { username: string | null } | null };
function mapCredits(raw: RawCredit[]): ArtworkCreditData[] {
  return raw.map((c) => ({ id: c.id, userId: c.userId, username: c.user?.username ?? null, label: c.label, url: c.url }));
}

interface CharacterData {
  id: string;
  numId: number;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  birthdate: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  mbti: string | null;
  kingdom: string | null;
  ethnicity: string | null;
  race: string | null;
  gender: string | null;
  orientation: string | null;
  customFieldName: string | null;
  custom: string | null;
  voiceClaimUrl: string | null;
  playlistUrl: string | null;
  spotifyPlaylistUrl: string | null;
  summary: string | null;
  biography: string | null;
  sections: string | null;
  profileBlockOrder: string | null;
  relationshipsA: { id: string; type: string; typeB: string | null; description: string | null; status?: string; externalName?: string | null; externalImageUrl?: string | null; characterB: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; user?: { username: string | null } } | null }[];
  relationshipsB: { id: string; type: string; typeB: string | null; description: string | null; status?: string; characterA: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; user?: { username: string | null } } }[];
  isDesigner: boolean;
  designerCredit: string | null;
  isWriter: boolean;
  writerCredit: string | null;
  createdAt: Date;
  isPublic: boolean;
  user: { username: string | null };
  artworks: Artwork[];
  tags: Tag[];
  colorPalettes: { id: string; swatches: Swatch[] }[];
  favorites: { id: string }[];
  galleries: { id: string; name: string; images: { id: string; artworkId: string; order: number }[] }[];
  baseCharacter: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; isPublic: boolean; variants: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; variantLabel: string | null; isPublic: boolean }[] } | null;
  variants: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; variantLabel: string | null; isPublic: boolean }[];
}

interface Props {
  character: CharacterData;
  isOwner: boolean;
  currentUserId: string | null;
  initialFavorited?: boolean;
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

function SectionCard({ title, action, children }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "var(--novae-text-xs)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "var(--novae-text-secondary)",
            flex: 1,
          }}
        >
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function SortableBlock({ id, draggable, children }: { id: string; draggable: boolean; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !draggable });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, position: "relative" }}
    >
      {draggable && (
        <div
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 2,
            width: 24, height: 24, borderRadius: "var(--novae-radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "grab", touchAction: "none",
            color: "var(--novae-text-secondary)",
            background: "var(--novae-bg-card)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Playlist importer ──────────────────────────────────────────────────────

function PlaylistImport({ onImport }: { onImport: (tracks: { id: string; title: string; artist: string }[]) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to import"); return; }
      if (!data.tracks?.length) { setError("No tracks found in this playlist"); return; }
      onImport(data.tracks);
      setUrl("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleImport(); }}
          placeholder="Import from YouTube playlist URL…"
          style={{
            background: "var(--novae-bg-input)",
            border: "1px solid var(--novae-outline-all)",
            borderRadius: "var(--novae-radius-sm)",
            outline: "none",
            color: "var(--novae-text-primary)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-sm)",
            padding: "6px 10px",
            flex: 1,
            boxSizing: "border-box" as const,
          }}
        />
        <button
          onClick={handleImport}
          disabled={!url.trim() || loading}
          style={{
            padding: "6px 14px",
            background: url.trim() && !loading ? "var(--novae-btn-primary)" : "var(--novae-bg-card)",
            border: "1px solid var(--novae-outline-all)",
            borderRadius: "var(--novae-radius-sm)",
            color: url.trim() && !loading ? "#fff" : "var(--novae-text-secondary)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-sm)",
            fontWeight: 600,
            cursor: url.trim() && !loading ? "pointer" : "not-allowed",
            flexShrink: 0,
          }}
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </div>
      {error && (
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-error, #e05252)" }}>
          {error}
        </span>
      )}
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
        top: 0,
        left: "110%",
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

// ─── Placeholder data ───────────────────────────────────────────────────────

const PLACEHOLDER_STORY = [
  {
    id: "1",
    title: "The First Chapter",
    description: "In the beginning, before the world knew her name, she wandered the forgotten roads between kingdoms, carrying nothing but a blade and a purpose no one else could see.",
    date: "03/12/2025",
    coverUrl: null as string | null,
  },
  {
    id: "2",
    title: "Echoes of the Past",
    description: "Old wounds resurface when a mysterious letter arrives bearing a seal she thought buried forever. The choices she makes now will echo through every story that follows.",
    date: "07/28/2025",
    coverUrl: null as string | null,
  },
];

const PLACEHOLDER_MUSIC = [
  {
    id: "1",
    title: "Placeholder Song Title",
    artist: "Artist Name",
    url: null as string | null,
    thumbnailUrl: null as string | null,
  },
  {
    id: "2",
    title: "Another Track",
    artist: "Another Artist",
    url: null as string | null,
    thumbnailUrl: null as string | null,
  },
];

const PLACEHOLDER_RELATIONSHIPS = [
  {
    id: "1",
    name: "Character Name",
    role: "Best Friend",
    description: "A steadfast companion through the darkest of times, always the first to offer a hand.",
    avatarUrl: null as string | null,
  },
  {
    id: "2",
    name: "Another Character",
    role: "Rival",
    description: "Their rivalry began years ago and still burns with the fire of unresolved history.",
    avatarUrl: null as string | null,
  },
];

// ─── Gallery DnD sub-components ──────────────────────────────────────────────

type GalleryData = { id: string; name: string; images: { id: string; artworkId: string; order: number }[] };

function DraggableArtworkTile({
  artwork, isOwner, galleries, characterId, assigningArtwork, setAssigningArtwork,
  setLightbox, openEditCredits, deleteArtwork, setGalleries, isDndActive,
  selectMode, isSelected, onToggleSelect,
}: {
  artwork: Artwork;
  isOwner: boolean;
  galleries: GalleryData[];
  characterId: string;
  assigningArtwork: string | null;
  setAssigningArtwork: React.Dispatch<React.SetStateAction<string | null>>;
  setLightbox: (v: { url: string; credits: ArtworkCreditData[] } | null) => void;
  openEditCredits: (a: Artwork) => void;
  deleteArtwork: (id: string) => void;
  setGalleries: React.Dispatch<React.SetStateAction<GalleryData[]>>;
  isDndActive: boolean;
  selectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `artwork-${artwork.id}`, disabled: selectMode });
  const hasThumbnail = !!artwork.thumbnailUrl;
  const dragProps = isOwner && isDndActive && !selectMode ? { ...attributes, ...listeners } : {};
  const tileStyle: React.CSSProperties = {
    position: "relative",
    aspectRatio: hasThumbnail ? "1" : undefined,
    borderRadius: "var(--novae-radius-md)", overflow: "hidden",
    backgroundColor: "var(--novae-bg-card)",
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
    outline: isSelected ? "2px solid var(--novae-btn-primary)" : "none",
    outlineOffset: -2,
    cursor: selectMode ? "pointer" : isDragging ? "grabbing" : "zoom-in",
  };
  const handleClick = () => {
    if (isDragging) return;
    if (selectMode) { onToggleSelect?.(artwork.id); return; }
    setLightbox({ url: artwork.imageUrl, credits: artwork.credits });
  };
  return (
    <div ref={setNodeRef} style={tileStyle} {...dragProps} onClick={handleClick}>
      <SensitiveImageWrapper sensitiveType={artwork.sensitiveType} className="absolute inset-0">
        {hasThumbnail ? (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Image src={artwork.thumbnailUrl!} alt="" fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" />
          </div>
        ) : (
          <img src={thumbUrl(artwork.imageUrl, 640) ?? artwork.imageUrl} alt="" loading="lazy" decoding="async" style={{ width: "100%", display: "block", pointerEvents: "none" }} />
        )}
      </SensitiveImageWrapper>
      <SensitiveBadge sensitiveType={artwork.sensitiveType} side="left" />
      {isOwner && selectMode && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(artwork.id); }}
          style={{
            position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%",
            border: `2px solid ${isSelected ? "var(--novae-btn-primary)" : "#fff"}`,
            background: isSelected ? "var(--novae-btn-primary)" : "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 15, cursor: "pointer",
          }}
        >
          {isSelected && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>
      )}
      {isOwner && !selectMode && (
        <div className="artwork-actions" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}>
          {galleries.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setAssigningArtwork((prev) => prev === artwork.id ? null : artwork.id); }} style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Manage categories">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); openEditCredits(artwork); }} style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit credits">
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteArtwork(artwork.id); }} style={{ width: 28, height: 28, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">×</button>
        </div>
      )}
      {isOwner && assigningArtwork === artwork.id && galleries.length > 0 && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", bottom: 6, left: 6, right: 6, background: "rgba(0,0,0,0.88)", borderRadius: "var(--novae-radius-sm)", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4, zIndex: 20 }}>
          {galleries.map((g) => {
            const inGallery = g.images.some((i) => i.artworkId === artwork.id);
            return (
              <label key={g.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)" }}>
                <input type="checkbox" checked={inGallery} onChange={async () => {
                  const res = await fetch(`/api/characters/${characterId}/galleries/${g.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: artwork.id, remove: inGallery }) });
                  if (res.ok) setGalleries((prev) => prev.map((gal) => {
                    if (gal.id !== g.id) return gal;
                    if (inGallery) return { ...gal, images: gal.images.filter((i) => i.artworkId !== artwork.id) };
                    return { ...gal, images: [...gal.images, { id: Math.random().toString(), artworkId: artwork.id, order: 0 }] };
                  }));
                }} style={{ accentColor: "var(--novae-btn-primary)", cursor: "pointer" }} />
                {g.name}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Combines drag (reordering the folder itself, via a handle) and drop (accepting an
// artwork dragged onto it) on a single dnd-kit id, so there's exactly one droppable
// target per folder — two overlapping droppables with different ids made `over.id`
// resolution ambiguous and broke reordering.
function SortableGallerySection({
  galleryId, draggable, isOver, children,
}: {
  galleryId: string;
  draggable: boolean;
  isOver: boolean;
  children: (dragHandle: { attributes: ReturnType<typeof useSortable>["attributes"]; listeners: ReturnType<typeof useSortable>["listeners"] }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: galleryId, disabled: !draggable });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform), opacity: isDragging ? 0.5 : 1,
        transition: transition ? `${transition}, border-color 0.15s` : "border-color 0.15s",
        borderRadius: "var(--novae-radius-md)", border: `2px dashed ${isOver ? "var(--novae-text-link)" : "transparent"}`, padding: isOver ? 8 : 0,
      }}
    >
      {children({ attributes, listeners })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CharacterPageClient({ character, isOwner, currentUserId, initialFavorited = false }: Props) {
  const router = useRouter();
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "story" | "relationships" | "gallery" | "timeline">("profile");
  const [showAuModal, setShowAuModal] = useState(false);
  const [auName, setAuName] = useState("");
  const [auLabel, setAuLabel] = useState("");
  const [creatingAu, setCreatingAu] = useState(false);

  // "Star" topology: every AU points to the root character. The switcher always shows
  // [root, ...all variants of root], regardless of which one is currently open.
  const rootCharacter = character.baseCharacter
    ? { id: character.baseCharacter.id, name: character.baseCharacter.name, numId: character.baseCharacter.numId, slug: character.baseCharacter.slug, avatarUrl: character.baseCharacter.avatarUrl }
    : { id: character.id, name: character.name, numId: character.numId, slug: character.slug, avatarUrl: character.avatarUrl };
  const auVariants = character.baseCharacter ? character.baseCharacter.variants : character.variants;

  const createAlternateUniverse = useCallback(async () => {
    if (!auName.trim()) return;
    setCreatingAu(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: auName.trim(),
          baseCharacterId: rootCharacter.id,
          variantLabel: auLabel.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      setShowAuModal(false);
      setAuName("");
      setAuLabel("");
      router.push(characterUrl(created.numId, created.slug));
    } catch {
      // no-op: keep modal open so the user can retry
    } finally {
      setCreatingAu(false);
    }
  }, [auName, auLabel, rootCharacter.id, router]);

  const [auToDelete, setAuToDelete] = useState<{ id: string; label: string; isViewingIt: boolean } | null>(null);
  const [deletingAu, setDeletingAu] = useState(false);

  const confirmDeleteAlternateUniverse = useCallback(async () => {
    if (!auToDelete) return;
    setDeletingAu(true);
    try {
      const res = await fetch(`/api/characters/${auToDelete.id}`, { method: "DELETE" });
      if (!res.ok) return;
      if (auToDelete.isViewingIt) {
        router.push(characterUrl(rootCharacter.numId, rootCharacter.slug));
      } else {
        router.refresh();
      }
      setAuToDelete(null);
    } finally {
      setDeletingAu(false);
    }
  }, [auToDelete, rootCharacter.numId, rootCharacter.slug, router]);

  // Edit state mirrors the DB fields
  const [name, setName] = useState(character.name);
  const [description, setDescription] = useState(character.description ?? "");
  const [birthdate, setBirthdate] = useState(character.birthdate ?? "");
  const [age, setAge] = useState(character.age ?? "");
  const [height, setHeight] = useState(character.height ?? "");
  const [weight, setWeight] = useState(character.weight ?? "");
  const [mbti, setMbti] = useState(character.mbti ?? "");
  const [kingdom, setKingdom] = useState(character.kingdom ?? "");
  const [ethnicity, setEthnicity] = useState(character.ethnicity ?? "");
  const [race, setRace] = useState(character.race ?? "");
  const [gender, setGender] = useState(character.gender ?? "");
  const [orientation, setOrientation] = useState(character.orientation ?? "");
  const [customFieldName, setCustomFieldName] = useState(character.customFieldName ?? "");
  const [custom, setCustom] = useState(character.custom ?? "");

  // Designer / Writer credit edit state
  const parseCredit = (raw: string | null): { type: "onsite" | "offsite"; value: string; label: string } => {
    if (!raw) return { type: "onsite", value: "", label: "" };
    if (raw.startsWith("@")) return { type: "onsite", value: raw.slice(1), label: "" };
    const m = raw.match(/^\[(.+)\]\((.+)\)$/);
    if (m) return { type: "offsite", value: m[2], label: m[1] };
    return { type: "onsite", value: raw, label: "" };
  };
  const [isDesigner, setIsDesigner] = useState(character.isDesigner);
  const parsed = parseCredit(character.designerCredit);
  const [creditType, setCreditType] = useState<"onsite" | "offsite">(parsed.type);
  const [creditValue, setCreditValue] = useState(parsed.value);
  const [creditLabel, setCreditLabel] = useState(parsed.label);
  const [isWriter, setIsWriter] = useState(character.isWriter);
  const parsedWriter = parseCredit(character.writerCredit);
  const [writerType, setWriterType] = useState<"onsite" | "offsite">(parsedWriter.type);
  const [writerValue, setWriterValue] = useState(parsedWriter.value);
  const [writerLabel, setWriterLabel] = useState(parsedWriter.label);
  const [voiceClaimUrl, setVoiceClaimUrl] = useState(character.voiceClaimUrl ?? "");

  type Track = { id: string; title: string; artist: string };
  const parseTracks = (): Track[] => {
    if (!character.playlistUrl) return [];
    try {
      const parsed = JSON.parse(character.playlistUrl);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  };
  const [tracks, setTracks] = useState<Track[]>(parseTracks);
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState(character.spotifyPlaylistUrl ?? "");
  const [summary, setSummary] = useState(character.summary ?? "");
  const [biography, setBiography] = useState(character.biography ?? "");
  const [avatarUrl, setAvatarUrl] = useState(character.avatarUrl ?? "");
  const [isPublic, setIsPublic] = useState(character.isPublic);

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

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; credits: ArtworkCreditData[] } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Galleries
  const [galleries, setGalleries] = useState<GalleryData[]>(character.galleries ?? []);
  const [collapsedGalleries, setCollapsedGalleries] = useState<Record<string, boolean>>({});
  const [galleryDragId, setGalleryDragId] = useState<string | null>(null);
  const [galleryOverId, setGalleryOverId] = useState<string | null>(null);
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [newGalleryName, setNewGalleryName] = useState("");
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [renamingGallery, setRenamingGallery] = useState<{ id: string; name: string } | null>(null);
  const [assigningArtwork, setAssigningArtwork] = useState<string | null>(null); // artworkId
  const [selectMode, setSelectMode] = useState(false);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<Set<string>>(new Set());
  const [bulkMoveGalleryId, setBulkMoveGalleryId] = useState<string>("");

  // Relationships
  type RelEntry = {
    id: string; type: string; typeRaw: string; typeBRaw: string | null; isA: boolean; description: string | null;
    status: string;
    character: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; user?: { username: string | null } } | null;
    externalName: string | null; externalImageUrl: string | null;
  };
  const initRels = (): RelEntry[] => [
    ...character.relationshipsA.map((r) => ({ id: r.id, type: r.type, typeRaw: r.type, typeBRaw: r.typeB, isA: true, description: r.description, status: r.status ?? "accepted", character: r.characterB, externalName: (r as { externalName?: string | null }).externalName ?? null, externalImageUrl: (r as { externalImageUrl?: string | null }).externalImageUrl ?? null })),
    ...character.relationshipsB.map((r) => ({ id: r.id, type: r.typeB ?? r.type, typeRaw: r.type, typeBRaw: r.typeB, isA: false, description: r.description, status: r.status ?? "accepted", character: r.characterA, externalName: null, externalImageUrl: null })),
  ];
  const [relationships, setRelationships] = useState<RelEntry[]>(initRels);
  const [showAddRel, setShowAddRel] = useState(false);
  const [relMode, setRelMode] = useState<"site" | "external">("site");
  // step 1: which user owns the character
  type RelUser = { id: string; username: string | null; name: string | null; avatar: string | null };
  const [relUser, setRelUser] = useState<RelUser | null>(null); // null = not chosen yet
  const [relUserSearch, setRelUserSearch] = useState("");
  const [relUserResults, setRelUserResults] = useState<RelUser[]>([]);
  const [relUserLoading, setRelUserLoading] = useState(false);
  // step 2: the character
  const [relSearch, setRelSearch] = useState("");
  const [relSearchResults, setRelSearchResults] = useState<{ id: string; name: string; numId: number; slug: string; avatarUrl: string | null; user?: { username: string | null } }[]>([]);
  const [relSearchLoading, setRelSearchLoading] = useState(false);
  const [relSelectedChar, setRelSelectedChar] = useState<{ id: string; name: string; numId: number; slug: string; avatarUrl: string | null } | null>(null);
  const [relExternalName, setRelExternalName] = useState("");
  const [relExternalImage, setRelExternalImage] = useState("");
  const [relType, setRelType] = useState("");
  const [relTypeB, setRelTypeB] = useState("");
  const [relDesc, setRelDesc] = useState("");
  const [relSaving, setRelSaving] = useState(false);
  // myLabel = label from current char's perspective, otherLabel = the other side's label
  const [editingRel, setEditingRel] = useState<{ id: string; isA: boolean; myLabel: string; otherLabel: string; description: string; error?: string } | null>(null);

  const searchRelUsers = async (q: string) => {
    if (!q.trim()) { setRelUserResults([]); return; }
    setRelUserLoading(true);
    try {
      const res = await fetch(`/api/users/search?multi=1&q=${encodeURIComponent(q)}`);
      if (res.ok) { const { users } = await res.json(); setRelUserResults(users ?? []); }
    } finally { setRelUserLoading(false); }
  };

  // search characters belonging to the chosen user (relUser)
  const searchRelChars = async (q: string) => {
    if (!relUser) { setRelSearchResults([]); return; }
    setRelSearchLoading(true);
    try {
      const params = new URLSearchParams({ userId: relUser.id, limit: "20", exclude: character.id });
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`/api/characters?${params.toString()}`);
      if (res.ok) setRelSearchResults(await res.json());
    } finally { setRelSearchLoading(false); }
  };

  const pickRelUser = (u: RelUser) => {
    setRelUser(u);
    setRelUserResults([]); setRelUserSearch("");
    setRelSelectedChar(null); setRelSearch(""); setRelSearchResults([]);
  };

  const meUser: RelUser = { id: currentUserId ?? "", username: character.user?.username ?? null, name: null, avatar: avatarUrl ?? null };

  const addRelationship = async () => {
    if (!relType.trim()) return;
    if (relMode === "site" && !relSelectedChar) return;
    if (relMode === "external" && !relExternalName.trim()) return;
    setRelSaving(true);
    try {
      const body = relMode === "site"
        ? { characterBId: relSelectedChar!.id, type: relType.trim(), typeB: relTypeB.trim() || null, description: relDesc.trim() || null }
        : { externalName: relExternalName.trim(), externalImageUrl: relExternalImage.trim() || null, type: relType.trim(), typeB: null, description: relDesc.trim() || null };
      const res = await fetch(`/api/characters/${character.id}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const raw = await res.json();
        setRelationships((prev) => [...prev, raw]);
        setShowAddRel(false);
        setRelUser(null); setRelUserSearch(""); setRelUserResults([]);
        setRelSearch(""); setRelSearchResults([]); setRelSelectedChar(null);
        setRelExternalName(""); setRelExternalImage("");
        setRelType(""); setRelTypeB(""); setRelDesc("");
      }
    } finally { setRelSaving(false); }
  };

  const deleteRelationship = async (relId: string) => {
    await fetch(`/api/characters/${character.id}/relationships/${relId}`, { method: "DELETE" });
    setRelationships((prev) => prev.filter((r) => r.id !== relId));
  };

  const saveEditRel = async () => {
    if (!editingRel) return;
    // typeA = other char's role (shows on current char's page); typeB = current char's role (shows on other char's page)
    const typeA = (editingRel.isA ? editingRel.otherLabel : editingRel.myLabel).trim();
    const typeB = (editingRel.isA ? editingRel.myLabel : editingRel.otherLabel).trim();
    if (!typeA) return;
    setRelSaving(true);
    try {
      const res = await fetch(`/api/characters/${character.id}/relationships/${editingRel.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: typeA, typeB: typeB || null, description: editingRel.description.trim() || null }),
      });
      if (res.ok) {
        setRelationships((prev) => prev.map((r) => r.id === editingRel.id
          ? { ...r, type: editingRel.isA ? typeA : (typeB || typeA), typeRaw: typeA, typeBRaw: typeB || null, description: editingRel.description.trim() || null }
          : r
        ));
        setEditingRel(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setEditingRel((r) => r && { ...r, error: body.error ?? `Error ${res.status}` });
      }
    } finally { setRelSaving(false); }
  };

  // Crop modals
  const [avatarCropSrc, setAvatarCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [artworkCropSrc, setArtworkCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [artworkThumbnailFile, setArtworkThumbnailFile] = useState<File | null>(null);

  // Creator modal
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [pendingIsAvatar, setPendingIsAvatar] = useState(false);
  const [pendingCredits, setPendingCredits] = useState<CreditDraft[]>([emptyCredit()]);
  const [pendingSensitiveType, setPendingSensitiveType] = useState<string | null>(null);

  // Informations: which fields are visible
  const ALL_INFO_FIELDS: { key: string; label: string; state: string; setter: React.Dispatch<React.SetStateAction<string>>; dbVal: string | null; multiline?: boolean }[] = [
    { key: "gender",      label: "Gender",      state: gender,      setter: setGender,      dbVal: character.gender },
    { key: "orientation", label: "Orientation", state: orientation, setter: setOrientation, dbVal: character.orientation },
    { key: "birthdate",  label: "Birthdate",  state: birthdate,  setter: setBirthdate,  dbVal: character.birthdate },
    { key: "age",        label: "Age",        state: age,        setter: setAge,        dbVal: character.age },
    { key: "height",     label: "Height",     state: height,     setter: setHeight,     dbVal: character.height },
    { key: "weight",     label: "Weight",     state: weight,     setter: setWeight,     dbVal: character.weight },
    { key: "mbti",       label: "MBTI",       state: mbti,       setter: setMbti,       dbVal: character.mbti },
    { key: "kingdom",    label: "Kingdom",    state: kingdom,    setter: setKingdom,    dbVal: character.kingdom },
    { key: "ethnicity",  label: "Ethnicity",  state: ethnicity,  setter: setEthnicity,  dbVal: character.ethnicity },
    { key: "race",       label: "Race",       state: race,       setter: setRace,       dbVal: character.race },
  ];
  const [activeInfoKeys, setActiveInfoKeys] = useState<string[]>(
    ALL_INFO_FIELDS.filter((f) => !!f.dbVal).map((f) => f.key)
  );
  const [showInfoFieldPicker, setShowInfoFieldPicker] = useState(false);

  // Multiple custom fields
  type CustomField = { id: string; name: string; content: string };
  type Container = { id: string; title: string; content: string };

  const parseCustomFields = (): CustomField[] => {
    if (!character.custom) return [];
    try {
      const parsed = JSON.parse(character.custom);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [{ id: "legacy", name: character.customFieldName || "Custom", content: character.custom }];
  };

  const parseContainers = (): Container[] => {
    if (!character.sections) return [];
    try { return JSON.parse(character.sections); } catch { return []; }
  };

  const [customFields, setCustomFields] = useState<CustomField[]>(parseCustomFields);
  const [customContainers, setCustomContainers] = useState<Container[]>(parseContainers);

  // Middle-column block order (drag & drop, Profile tab)
  const parseBlockOrder = (): string[] => {
    if (!character.profileBlockOrder) return [];
    try {
      const parsed = JSON.parse(character.profileBlockOrder);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  };
  const [blockOrder, setBlockOrder] = useState<string[]>(parseBlockOrder);
  const profileSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Edit credits modal
  const [editingCredits, setEditingCredits] = useState<Artwork | null>(null);
  const [creditsDrafts, setCreditsDrafts] = useState<CreditDraft[]>([emptyCredit()]);
  const [creditsCharacters, setCreditsCharacters] = useState<{ id: string; name: string; numId: number; slug: string }[]>([]);
  const [creditsCharSearch, setCreditsCharSearch] = useState("");
  const [creditsCharResults, setCreditsCharResults] = useState<{ id: string; name: string; numId: number; slug: string }[]>([]);
  const [creditsCharLoading, setCreditsCharLoading] = useState(false);
  const [creditsSensitiveType, setCreditsSensitiveType] = useState<string | null>(null);
  // Thumbnail editing inside edit-credits modal
  const [editThumbCropSrc, setEditThumbCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [editThumbFile, setEditThumbFile] = useState<File | null>(null);
  const [editThumbPreview, setEditThumbPreview] = useState<string | null>(null);
  const [editThumbRemoved, setEditThumbRemoved] = useState(false);

  // Favorite
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favoritesCount, setFavoritesCount] = useState(character.favorites.length);
  const [favLoading, setFavLoading] = useState(false);

  // ── Save handler ──────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError("");
    try {
      // Save character fields
      const charRes = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, birthdate, age, height, weight, mbti, kingdom, ethnicity, race, gender, orientation,
          custom: customFields.length > 0 ? JSON.stringify(customFields) : null,
          sections: customContainers.length > 0 ? JSON.stringify(customContainers) : null,
          profileBlockOrder: blockOrder.length > 0 ? JSON.stringify(blockOrder) : null,
          customFieldName: null,
          voiceClaimUrl,
          playlistUrl: tracks.length > 0 ? JSON.stringify(tracks) : null,
          spotifyPlaylistUrl: spotifyPlaylistUrl.trim() || null,
          summary, biography, avatarUrl, isPublic,
          isDesigner,
          designerCredit: isDesigner ? null : (creditValue.trim()
            ? creditType === "onsite" ? `@${creditValue.trim()}` : `[${creditLabel.trim()}](${creditValue.trim()})`
            : null),
          isWriter,
          writerCredit: isWriter ? null : (writerValue.trim()
            ? writerType === "onsite" ? `@${writerValue.trim()}` : `[${writerLabel.trim()}](${writerValue.trim()})`
            : null),
        }),
      });
      if (!charRes.ok) {
        const errData = await charRes.json().catch(() => null);
        setSaveError(errData?.error ?? "Failed to save changes. Please try again.");
        return;
      }
      const charData = await charRes.json();

      // Save palette
      await fetch(`/api/characters/${character.id}/palette`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swatches }),
      });

      setEditing(false);
      if (charData?.numId && charData?.slug && charData.slug !== character.slug) {
        router.replace(`/library/characters/${charData.numId}-${charData.slug}`);
      } else {
        router.refresh();
      }
    } catch {
      setSaveError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [character.id, name, description, birthdate, age, height, weight, mbti, kingdom, ethnicity, race, gender, orientation, customFields, customContainers, blockOrder, voiceClaimUrl, tracks, summary, biography, avatarUrl, isPublic, isDesigner, creditType, creditValue, creditLabel, isWriter, writerType, writerValue, writerLabel, swatches, router]);

  const cancelEdit = () => {
    setSaveError("");
    setName(character.name);
    setDescription(character.description ?? "");
    setBirthdate(character.birthdate ?? "");
    setAge(character.age ?? "");
    setHeight(character.height ?? "");
    setWeight(character.weight ?? "");
    setMbti(character.mbti ?? "");
    setKingdom(character.kingdom ?? "");
    setEthnicity(character.ethnicity ?? "");
    setRace(character.race ?? "");
    setGender(character.gender ?? "");
    setOrientation(character.orientation ?? "");
    setCustomFieldName(character.customFieldName ?? "");
    setCustom(character.custom ?? "");
    setVoiceClaimUrl(character.voiceClaimUrl ?? "");
    setTracks(parseTracks());
    setIsDesigner(character.isDesigner);
    const p = parseCredit(character.designerCredit);
    setCreditType(p.type); setCreditValue(p.value); setCreditLabel(p.label);
    setIsWriter(character.isWriter);
    const pw = parseCredit(character.writerCredit);
    setWriterType(pw.type); setWriterValue(pw.value); setWriterLabel(pw.label);
    setCustomFields(parseCustomFields());
    setCustomContainers(parseContainers());
    setAvatarUrl(character.avatarUrl ?? "");
    setSummary(character.summary ?? "");
    setBiography(character.biography ?? "");
    setIsPublic(character.isPublic);
    setSwatches(initialSwatches);
    setEditing(false);
  };

  // ── Tag handlers ──────────────────────────────────────────────────────────

  const addTag = async (name?: string) => {
    const raw = (name ?? tagInput).trim();
    if (!raw) return;
    setAddingTag(true);
    try {
      const res = await fetch(`/api/characters/${character.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: raw }),
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

  const uploadArtwork = async (files: File[], isAvatar = false, credits?: CreditDraft[], thumbnailFile?: File | null, sensitiveType?: string | null) => {
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
        // Upload thumbnail separately if provided (only makes sense for single-file uploads)
        let thumbnailUrl: string | null = null;
        if (thumbnailFile && files.length === 1) {
          const thumbUploaded = await startArtworkUpload([thumbnailFile]);
          thumbnailUrl = thumbUploaded?.[0]?.ufsUrl ?? null;
        }

        const creditsPayload = (credits ?? []).map((c) => ({ type: c.type, value: c.value.trim(), label: c.label.trim() }));

        for (const file of uploaded) {
          const res = await fetch(`/api/characters/${character.id}/artworks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: file.ufsUrl,
              thumbnailUrl,
              credits: creditsPayload,
              sensitiveType: sensitiveType ?? null,
            }),
          });
          if (res.ok) {
            const artwork = await res.json();
            setArtworks((prev) => [{ ...artwork, credits: mapCredits(artwork.credits) }, ...prev]);
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

  const toggleSelectArtwork = (artworkId: string) => {
    setSelectedArtworkIds((prev) => {
      const next = new Set(prev);
      if (next.has(artworkId)) next.delete(artworkId); else next.add(artworkId);
      return next;
    });
  };

  const clearSelection = () => { setSelectedArtworkIds(new Set()); setSelectMode(false); setBulkMoveGalleryId(""); };

  const bulkDeleteArtworks = async () => {
    const ids = Array.from(selectedArtworkIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} image${ids.length > 1 ? "s" : ""}?`)) return;
    await Promise.all(ids.map((id) => fetch(`/api/characters/${character.id}/artworks/${id}`, { method: "DELETE" })));
    setArtworks((prev) => prev.filter((a) => !selectedArtworkIds.has(a.id)));
    clearSelection();
  };

  const bulkMoveToGallery = async (galleryId: string) => {
    const ids = Array.from(selectedArtworkIds);
    if (ids.length === 0 || !galleryId) return;
    await Promise.all(ids.map((id) => fetch(`/api/characters/${character.id}/galleries/${galleryId}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: id }),
    })));
    setGalleries((prev) => prev.map((gal) => {
      if (gal.id !== galleryId) return gal;
      const existing = new Set(gal.images.map((i) => i.artworkId));
      const additions = ids.filter((id) => !existing.has(id)).map((id) => ({ id: Math.random().toString(), artworkId: id, order: 0 }));
      return additions.length > 0 ? { ...gal, images: [...gal.images, ...additions] } : gal;
    }));
    clearSelection();
  };

  const openEditCredits = (artwork: Artwork) => {
    const drafts: CreditDraft[] = (artwork.credits ?? []).map((c) =>
      c.userId && c.username
        ? { type: "onsite" as const, value: c.username, label: "" }
        : { type: "offsite" as const, value: c.url ?? "", label: c.label ?? "" }
    );
    setCreditsDrafts(drafts.length > 0 ? drafts : [emptyCredit()]);
    setCreditsCharacters(artwork.characters ?? []);
    setCreditsSensitiveType(artwork.sensitiveType ?? null);
    setCreditsCharSearch("");
    setCreditsCharResults([]);
    setEditThumbFile(null);
    setEditThumbPreview(null);
    setEditThumbRemoved(false);
    setEditingCredits(artwork);
  };

  const searchCreditsChars = async (q: string) => {
    setCreditsCharSearch(q);
    if (!q.trim()) { setCreditsCharResults([]); return; }
    setCreditsCharLoading(true);
    try {
      const res = await fetch(`/api/characters?search=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setCreditsCharResults((data.characters ?? data).filter((c: { id: string }) => c.id !== character.id));
      }
    } finally {
      setCreditsCharLoading(false);
    }
  };

  const saveCredits = async () => {
    if (!editingCredits || !creditsValid(creditsDrafts)) return;
    const credits = creditsDrafts.map((c) => ({ type: c.type, value: c.value.trim(), label: c.label.trim() }));

    let newThumbnailUrl: string | null | undefined = undefined; // undefined = no change
    if (editThumbRemoved) {
      newThumbnailUrl = null;
    } else if (editThumbFile) {
      const uploaded = await startArtworkUpload([editThumbFile]);
      newThumbnailUrl = uploaded?.[0]?.ufsUrl ?? null;
    }

    const body: Record<string, unknown> = { credits, characterIds: creditsCharacters.map((c) => c.id), sensitiveType: creditsSensitiveType };
    if (newThumbnailUrl !== undefined) body.thumbnailUrl = newThumbnailUrl;

    const res = await fetch(`/api/characters/${character.id}/artworks/${editingCredits.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setArtworks((prev) => prev.map((a) => a.id === editingCredits.id
        ? { ...a, credits: mapCredits(updated.credits), characters: creditsCharacters, thumbnailUrl: newThumbnailUrl !== undefined ? newThumbnailUrl : a.thumbnailUrl, sensitiveType: creditsSensitiveType }
        : a,
      ));
    }
    setEditingCredits(null);
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
        setFavoritesCount((c) => f ? c + 1 : c - 1);
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

  const displayAvatar = avatarUrl || null;
  const latestImages = artworks.slice(0, 4);

  const visibleInfoFields = ALL_INFO_FIELDS.filter((f) => activeInfoKeys.includes(f.key));

  const TABS: { key: "profile" | "story" | "relationships" | "gallery" | "timeline"; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
    { key: "story", label: "Story", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { key: "relationships", label: "Relationships", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { key: "gallery", label: "Gallery", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { key: "timeline", label: "Timeline", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
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
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (!files.length) return;
          setArtworkThumbnailFile(null);
          if (files.length === 1) {
            // offer thumbnail crop for single-file uploads
            setArtworkCropSrc({ src: URL.createObjectURL(files[0]), file: files[0] });
            setPendingFiles(files);
          } else {
            setPendingFiles(files);
          }
          setPendingIsAvatar(false); setPendingCredits([{ type: "onsite", value: character.user.username ?? "", label: "" }]);
          e.target.value = "";
        }}
      />
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) setAvatarCropSrc({ src: URL.createObjectURL(file), file });
          e.target.value = "";
        }}
      />

      {/* ── Edit credits modal ────────────────────────────────────────── */}
      {editingCredits && (
        <div
          onClick={() => setEditingCredits(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#141820", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 32, width: "min(960px, 100vw)", maxWidth: "calc(100vw - 64px)", display: "flex", flexDirection: "column", gap: 20 }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Edit credits
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
              {/* Left column ─ thumbnail, characters, sensitive content */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Thumbnail */}
                <div>
                  <span style={{ display: "block", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Thumbnail (square crop)
                  </span>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Current full image */}
                    <div style={{ width: 72, flexShrink: 0, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "var(--novae-bg-card)" }}>
                      <img src={thumbUrl(editingCredits.imageUrl, 128) ?? editingCredits.imageUrl} alt="" style={{ width: "100%", display: "block" }} />
                    </div>

                    {/* Arrow */}
                    <div style={{ display: "flex", alignItems: "center", height: 72, color: "var(--novae-text-secondary)", flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>

                    {/* Thumbnail preview + controls */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <div style={{ width: 72, height: 72, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "var(--novae-bg-card)", flexShrink: 0, position: "relative" }}>
                        {(() => {
                          const src = editThumbRemoved ? null : (editThumbPreview ?? editingCredits.thumbnailUrl ?? null);
                          return src
                            ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                              </div>;
                        })()}
                      </div>
                      {/* Crop from existing image */}
                      <button
                        onClick={async () => {
                          const src = editThumbRemoved ? null : (editThumbPreview ?? editingCredits.thumbnailUrl ?? null);
                          const cropSrc = src ?? editingCredits.imageUrl;
                          const res = await fetch(cropSrc);
                          const blob = await res.blob();
                          const file = new File([blob], "thumbnail.jpg", { type: blob.type || "image/jpeg" });
                          setEditThumbCropSrc({ src: URL.createObjectURL(file), file });
                        }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", background: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 2 6 8 2 8"/><polyline points="18 22 18 16 22 16"/><path d="M2 8C2 5.79 3.79 4 6 4h8"/><path d="M22 16C22 18.21 20.21 20 18 20H10"/></svg>
                        Crop
                      </button>
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        Upload new
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setEditThumbCropSrc({ src: URL.createObjectURL(f), file: f });
                          e.target.value = "";
                        }} />
                      </label>
                      {(editThumbPreview || (!editThumbRemoved && editingCredits.thumbnailUrl)) && (
                        <button
                          onClick={() => { setEditThumbFile(null); setEditThumbPreview(null); setEditThumbRemoved(true); }}
                          style={{ padding: "6px 12px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", background: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Characters in this image */}
                <div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Characters in this image
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {creditsCharacters.map((c) => (
                      <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: "var(--novae-radius-sm)", background: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-tag)" }}>
                        {c.name}
                        <button onClick={() => setCreditsCharacters((prev) => prev.filter((x) => x.id !== c.id))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, fontSize: 13 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ position: "relative", marginTop: 8 }}>
                    <input
                      value={creditsCharSearch}
                      onChange={(e) => searchCreditsChars(e.target.value)}
                      placeholder="Search characters to tag…"
                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                    />
                    {creditsCharResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden" }}>
                        {creditsCharResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              if (!creditsCharacters.find((x) => x.id === c.id)) setCreditsCharacters((prev) => [...prev, c]);
                              setCreditsCharSearch(""); setCreditsCharResults([]);
                            }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {creditsCharLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--novae-text-secondary)" }}>…</span>}
                  </div>
                </div>

                {/* Sensitive content picker */}
                <div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Sensitive content
                  </span>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {([null, "nudity", "gore"] as const).map((val) => {
                      const label = val === null ? "None" : val === "nudity" ? "Nudity / fan service" : "Gore";
                      const active = creditsSensitiveType === val;
                      return (
                        <button
                          key={String(val)}
                          onClick={() => setCreditsSensitiveType(val)}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "var(--novae-radius-sm)",
                            border: `1px solid ${active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-outline-all)"}`,
                            background: active && val !== null ? "rgba(192,32,90,0.12)" : active ? "var(--novae-bg-tag)" : "none",
                            color: active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-text-secondary)",
                            fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                            fontWeight: active ? 600 : 400, cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column ─ credits */}
              <div>
                <span style={{ display: "block", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Credits
                </span>
                <ArtworkCreditsEditor
                  credits={creditsDrafts}
                  onChange={setCreditsDrafts}
                  meUsername={character.user.username}
                  inputStyle={{ fontSize: "var(--novae-text-base)" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditingCredits(null)} style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}>Cancel</button>
              <button
                onClick={saveCredits}
                disabled={!creditsValid(creditsDrafts)}
                style={{
                  flex: 1, padding: "10px 0",
                  background: creditsValid(creditsDrafts) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
                  border: "none", borderRadius: "var(--novae-radius-md)",
                  color: creditsValid(creditsDrafts) ? "#fff" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600,
                  cursor: creditsValid(creditsDrafts) ? "pointer" : "not-allowed",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "var(--novae-bg-card)", backdropFilter: "blur(8px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
            cursor: "zoom-out",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw", maxHeight: "82vh",
              borderRadius: "var(--novae-radius-lg)",
              objectFit: "contain",
              cursor: "default",
            }}
          />
          {lightbox.credits.length > 0 && (
            <p
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                color: "rgba(255,255,255,0.7)", margin: 0,
              }}
            >
              Art by <ArtworkCreditsDisplay credits={lightbox.credits} />
            </p>
          )}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed", top: 24, right: 24,
              width: 40, height: 40,
              background: "rgba(255,255,255,0.1)",
              border: "none", borderRadius: "50%",
              color: "#fff", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
      )}

      {/* ── Avatar crop modal ────────────────────────────────────────── */}
      {avatarCropSrc && (
        <ImageCropModal
          src={avatarCropSrc.src}
          filename={avatarCropSrc.file.name}
          originalFile={avatarCropSrc.file}
          aspect={1}
          onConfirm={(croppedFile) => {
            setAvatarCropSrc(null);
            setPendingFiles([croppedFile]);
            setPendingIsAvatar(true);
            setPendingCredits([{ type: "onsite", value: character.user.username ?? "", label: "" }]);
          }}
          onCancel={() => setAvatarCropSrc(null)}
        />
      )}

      {/* ── Artwork thumbnail crop modal ──────────────────────────────── */}
      {artworkCropSrc && (
        <ImageCropModal
          src={artworkCropSrc.src}
          filename={artworkCropSrc.file.name}
          originalFile={artworkCropSrc.file}
          aspect={1}
          onConfirm={(croppedFile) => {
            setArtworkThumbnailFile(croppedFile);
            setArtworkCropSrc(null);
          }}
          onCancel={() => setArtworkCropSrc(null)}
        />
      )}

      {/* ── Edit thumbnail crop modal ─────────────────────────────────── */}
      {editThumbCropSrc && (
        <ImageCropModal
          src={editThumbCropSrc.src}
          filename={editThumbCropSrc.file.name}
          originalFile={editThumbCropSrc.file}
          aspect={1}
          onConfirm={(croppedFile, preview) => {
            setEditThumbFile(croppedFile);
            setEditThumbPreview(preview);
            setEditThumbRemoved(false);
            setEditThumbCropSrc(null);
          }}
          onCancel={() => setEditThumbCropSrc(null)}
        />
      )}

      {/* ── Creator modal ─────────────────────────────────────────────── */}
      {pendingFiles && !artworkCropSrc && (
        <div
          onClick={() => { setPendingFiles(null); setArtworkThumbnailFile(null); }}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "transparent", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--novae-bg-main)",
              border: "1px solid var(--novae-outline-all)",
              borderRadius: "var(--novae-radius-lg)",
              padding: 32,
              width: "min(560px, calc(100vw - 128px))",
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Who made {pendingFiles.length > 1 ? "these images" : "this image"}?
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} selected.
            </p>

            <ArtworkCreditsEditor
              credits={pendingCredits}
              onChange={setPendingCredits}
              meUsername={character.user.username}
              inputStyle={{ fontSize: "var(--novae-text-base)" }}
            />

            {/* Sensitive type picker */}
            <div>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                Sensitive content
              </span>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {([null, "nudity", "gore"] as const).map((val) => {
                  const label = val === null ? "None" : val === "nudity" ? "Nudity / fan service" : "Gore";
                  const active = pendingSensitiveType === val;
                  return (
                    <button
                      key={String(val)}
                      onClick={() => setPendingSensitiveType(val)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "var(--novae-radius-sm)",
                        border: `1px solid ${active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-outline-all)"}`,
                        background: active && val !== null ? "rgba(192,32,90,0.12)" : active ? "var(--novae-bg-tag)" : "none",
                        color: active && val !== null ? "var(--novae-accent-main, #c0205a)" : "var(--novae-text-secondary)",
                        fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                        fontWeight: active ? 600 : 400, cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => { setPendingFiles(null); setArtworkThumbnailFile(null); setPendingSensitiveType(null); }}
                style={{
                  flex: 1, padding: "10px 0",
                  background: "none",
                  border: "1px solid var(--novae-outline-all)",
                  borderRadius: "var(--novae-radius-md)",
                  color: "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                  cursor: "pointer",
                }}
              >Cancel</button>
              <button
                disabled={!creditsValid(pendingCredits)}
                onClick={() => {
                  if (!creditsValid(pendingCredits)) return;
                  setPendingFiles(null);
                  uploadArtwork(pendingFiles!, pendingIsAvatar, pendingCredits, pendingIsAvatar ? null : artworkThumbnailFile, pendingSensitiveType);
                }}
                style={{
                  flex: 1, padding: "10px 0",
                  background: creditsValid(pendingCredits) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
                  border: "none",
                  borderRadius: "var(--novae-radius-md)",
                  color: creditsValid(pendingCredits) ? "#fff" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                  fontWeight: 600, cursor: creditsValid(pendingCredits) ? "pointer" : "not-allowed",
                }}
              >Upload</button>
            </div>
          </div>
        </div>
      )}

      <div className="char-body-grid relative px-8 pt-8 w-full items-start" style={{ gap: 24 }}>
        {/* ── Left column ──────────────────────────────────────────────── */}
        <div className="char-body-main gap-8 pb-8">

          {/* Header */}
          <div className="char-header-row flex items-center justify-between gap-4 w-full">
            {/* Avatar */}
            <div
              className="char-header-avatar relative shrink-0 rounded-[var(--novae-radius-lg)] overflow-hidden"
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
            <div className="char-header-meta flex flex-col flex-1 min-w-0 min-h-[280px] items-end justify-between pl-6 pr-2 py-2">
              {/* Action buttons */}
              <div className="char-header-actions flex gap-3 items-center shrink-0">
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
                      onClick={async () => {
                        const next = !isPublic;
                        setIsPublic(next);
                        await fetch(`/api/characters/${character.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ isPublic: next }),
                        });
                        router.refresh();
                      }}
                      style={{
                        display: "flex", gap: 6, alignItems: "center",
                        padding: "10px 16px",
                        background: isPublic ? "var(--novae-btn-secondary)" : "rgba(220,150,0,0.12)",
                        border: `1px solid ${isPublic ? "var(--novae-outline-all)" : "rgba(220,150,0,0.4)"}`,
                        borderRadius: "var(--novae-radius-md)",
                        color: isPublic ? "var(--novae-text-btn)" : "#e0a030",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-lg)",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                      title={isPublic ? "Visible to everyone — click to hide" : "Hidden from public — click to show"}
                    >
                      {isPublic ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                      {isPublic ? "Public" : "Hidden"}
                    </button>
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

              {editing && saveError && (
                <p style={{ color: "var(--novae-danger, #e5484d)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>
                  {saveError}
                </p>
              )}

              {/* Name + quote + meta */}
              <div className="char-header-bio flex flex-col gap-3 w-full">
                {/* Name row */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {editing ? (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{
                        ...inputStyle,
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: "var(--novae-text-5xl)",
                        fontWeight: 700,
                        padding: "8px 12px",
                        flex: 1,
                      }}
                    />
                  ) : (
                    <h1
                      className="char-header-name"
                      style={{
                        fontFamily: "var(--font-space-grotesk)",
                        fontSize: "var(--novae-text-5xl)",
                        fontWeight: 700,
                        color: "var(--novae-text-primary)",
                        margin: 0,
                      }}
                    >
                      {name}
                    </h1>
                  )}
                </div>

                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.characterDescriptionPlaceholder}
                    rows={3}
                    style={{ width: "100%", background: "rgba(25,32,46,0.6)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 12px", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontStyle: "italic", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                ) : (
                  description && (
                    <p style={{ margin: 0, fontStyle: "italic", color: "var(--novae-text-secondary)", fontSize: "var(--novae-text-lg)", lineHeight: "1.65" }}>
                      {description}
                    </p>
                  )
                )}

              </div>
            </div>
          </div>

          {/* Alternate universes switcher */}
          {(auVariants.length > 0 || isOwner) && (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" as const, gap: 8, marginTop: 4 }}>
              {[{ ...rootCharacter, variantLabel: null as string | null }, ...auVariants].map((v) => {
                const isCurrent = v.id === character.id;
                const isBase = v.id === rootCharacter.id;
                return (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "999px",
                      border: isCurrent ? "1px solid var(--novae-btn-primary)" : "1px solid var(--novae-outline-all)",
                      background: isCurrent ? "rgba(120,110,255,0.12)" : "var(--novae-bg-card)",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => !isCurrent && router.push(characterUrl(v.numId, v.slug))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px 4px 4px",
                        border: "none",
                        background: "transparent",
                        color: isCurrent ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "var(--novae-text-sm)",
                        fontWeight: isCurrent ? 600 : 400,
                        cursor: isCurrent ? "default" : "pointer",
                      }}
                    >
                      {v.avatarUrl ? (
                        <img src={thumbUrl(v.avatarUrl, 40)} alt="" width={20} height={20} loading="lazy" decoding="async" style={{ borderRadius: "50%", objectFit: "cover" as const }} />
                      ) : (
                        <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--novae-outline-all)" }} />
                      )}
                      {isBase ? t.auMain : (v.variantLabel || v.name)}
                    </button>
                    {isOwner && !isBase && (
                      <button
                        onClick={() => setAuToDelete({ id: v.id, label: v.variantLabel || v.name, isViewingIt: isCurrent })}
                        title={t.auDeleteTooltip}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 22,
                          height: 22,
                          marginRight: 4,
                          border: "none",
                          borderRadius: "50%",
                          background: "transparent",
                          color: "var(--novae-text-secondary)",
                          cursor: "pointer",
                          fontSize: "var(--novae-text-sm)",
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
              {isOwner && (
                <button
                  onClick={() => { setAuName(`${rootCharacter.name} (AU)`); setShowAuModal(true); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    border: "1px dashed var(--novae-outline-all)",
                    background: "transparent",
                    color: "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "var(--novae-text-sm)",
                    cursor: "pointer",
                  }}
                >
                  {t.auAddButton}
                </button>
              )}
            </div>
          )}

          {showAuModal && (
            <div
              onClick={() => !creatingAu && setShowAuModal(false)}
              style={{ position: "fixed", inset: 0, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-xl)", width: 380, display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", color: "var(--novae-text-primary)" }}>
                  {t.auModalTitle}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                  {t.auModalDescription.replace("{name}", rootCharacter.name)}
                </p>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{t.auNameLabel}</span>
                  <input value={auName} onChange={(e) => setAuName(e.target.value)} style={inputStyle} placeholder={t.auNamePlaceholder} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{t.auLabelLabel}</span>
                  <input value={auLabel} onChange={(e) => setAuLabel(e.target.value)} style={inputStyle} placeholder={t.auLabelPlaceholder} />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setShowAuModal(false)}
                    disabled={creatingAu}
                    style={{ padding: "8px 16px", borderRadius: "var(--novae-radius-md)", border: "1px solid var(--novae-outline-all)", background: "transparent", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", cursor: "pointer" }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={createAlternateUniverse}
                    disabled={creatingAu || !auName.trim()}
                    style={{ padding: "8px 16px", borderRadius: "var(--novae-radius-md)", border: "none", background: "var(--novae-btn-primary)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontWeight: 600, cursor: creatingAu ? "not-allowed" : "pointer", opacity: creatingAu || !auName.trim() ? 0.7 : 1 }}
                  >
                    {creatingAu ? t.auCreating : t.auCreate}
                  </button>
                </div>
              </div>
            </div>
          )}

          {auToDelete && (
            <div
              onClick={() => !deletingAu && setAuToDelete(null)}
              style={{ position: "fixed", inset: 0, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-xl)", width: 380, display: "flex", flexDirection: "column", gap: 12 }}
              >
                <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", color: "var(--novae-text-primary)" }}>
                  {t.auDeleteModalTitle}
                </h3>
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                  {t.auDeleteModalBody.replace("{label}", auToDelete.label)}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => setAuToDelete(null)}
                    disabled={deletingAu}
                    style={{ padding: "8px 16px", borderRadius: "var(--novae-radius-md)", border: "1px solid var(--novae-outline-all)", background: "transparent", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", cursor: "pointer" }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={confirmDeleteAlternateUniverse}
                    disabled={deletingAu}
                    style={{ padding: "8px 16px", borderRadius: "var(--novae-radius-md)", border: "none", background: "#e05252", color: "#fff", fontFamily: "var(--font-dm-sans)", fontWeight: 600, cursor: deletingAu ? "not-allowed" : "pointer", opacity: deletingAu ? 0.7 : 1 }}
                  >
                    {deletingAu ? t.auDeleting : t.auDelete}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Meta row — owner / designer / created */}
          <div
            className="char-meta-row"
            style={{
              display: "flex",
              flexWrap: "wrap" as const,
              gap: "24px",
              paddingTop: 16,
              borderTop: "1px solid var(--novae-outline-all)",
            }}
          >
            <MetaItem label="Owner" value={`@${character.user.username}`} href={`/~${character.user.username}`} />
            {/* Designer — view mode */}
            {!editing && (() => {
              if (character.isDesigner) {
                return <MetaItem label="Designer" value={`@${character.user.username}`} href={`/~${character.user.username}`} />;
              }
              if (!character.designerCredit) return null;
              if (character.designerCredit.startsWith("@")) {
                const u = character.designerCredit.slice(1);
                return <MetaItem label="Designer" value={`@${u}`} href={`/~${u}`} />;
              }
              const m = character.designerCredit.match(/^\[(.+)\]\((.+)\)$/);
              if (m) return <MetaItem label="Designer" value={m[1]} href={m[2]} />;
              return <MetaItem label="Designer" value={character.designerCredit} />;
            })()}
            {/* Designer — edit mode */}
            {editing && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Designer
                </span>
                <div style={{ display: "flex", borderRadius: "var(--novae-radius-sm)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
                  {([
                    { key: "me",      label: "Me" },
                    { key: "onsite",  label: "Novae" },
                    { key: "offsite", label: "Outside website" },
                  ] as const).map(({ key, label }) => {
                    const active = key === "me" ? isDesigner : (!isDesigner && creditType === key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === "me") { setIsDesigner(true); }
                          else { setIsDesigner(false); setCreditType(key); setCreditValue(""); setCreditLabel(""); }
                        }}
                        style={{
                          flex: 1, padding: "5px 0",
                          background: active ? "var(--novae-btn-primary)" : "none",
                          border: "none",
                          color: active ? "#fff" : "var(--novae-text-secondary)",
                          fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                          fontWeight: active ? 600 : 400, cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {!isDesigner && (
                  <>
                    {creditType === "offsite" && (
                      <input
                        value={creditLabel}
                        onChange={(e) => setCreditLabel(e.target.value)}
                        placeholder="Nom du designer"
                        style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                      />
                    )}
                    {creditType === "onsite" && (
                      <button
                        type="button"
                        onClick={() => setCreditValue(character.user.username ?? "")}
                        style={{ alignSelf: "flex-start", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
                      >
                        Me (@{character.user.username})
                      </button>
                    )}
                    {creditType === "onsite" ? (
                      <NovaeUserSearch
                        value={creditValue}
                        onChange={setCreditValue}
                        placeholder="Search username…"
                        inputStyle={{ fontSize: "var(--novae-text-sm)" }}
                      />
                    ) : (
                      <input
                        value={creditValue}
                        onChange={(e) => setCreditValue(e.target.value)}
                        placeholder="https://..."
                        style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                      />
                    )}
                  </>
                )}
              </div>
            )}
            <MetaItem
              label="Created"
              value={new Intl.DateTimeFormat("en-GB").format(new Date(character.createdAt))}
            />
          </div>

          {/* Tabs */}
          <div
            className="char-tabs"
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid var(--novae-outline-all)",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "12px 16px",
                  background: "none",
                  border: "none",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
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
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Profile */}
          {activeTab === "profile" && (
            <div className="char-body-grid items-start w-full">
              {/* Left sub-sidebar */}
              <div className="char-body-side flex-col gap-6" style={{ display: "flex" }}>

                {/* Informations */}
                <SectionCard
                  title="Informations"
                  action={isOwner && editing ? (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowInfoFieldPicker((v) => !v)}
                        style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "var(--novae-btn-primary)", border: "none",
                          color: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >+</button>
                      {showInfoFieldPicker && (
                        <div style={{
                          position: "absolute", right: 0, top: "110%", zIndex: 50,
                          background: "#141820",
                          border: "1px solid var(--novae-outline-all)",
                          borderRadius: "var(--novae-radius-md)",
                          padding: 8, minWidth: 160,
                          maxHeight: 200, overflowY: "auto",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                          display: "flex", flexDirection: "column", gap: 2,
                        }}>
                          {ALL_INFO_FIELDS.filter((f) => !activeInfoKeys.includes(f.key)).map((f) => (
                            <button
                              key={f.key}
                              onClick={() => {
                                setActiveInfoKeys((prev) => [...prev, f.key]);
                                setShowInfoFieldPicker(false);
                              }}
                              style={{
                                background: "none", border: "none", textAlign: "left",
                                padding: "6px 10px", borderRadius: "var(--novae-radius-sm)",
                                fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                                color: "var(--novae-text-primary)", cursor: "pointer",
                              }}
                            >{f.label}</button>
                          ))}
                          {/* Custom always available */}
                          <button
                            onClick={() => {
                              setCustomFields((prev) => [...prev, { id: crypto.randomUUID(), name: "", content: "" }]);
                              setShowInfoFieldPicker(false);
                            }}
                            style={{
                              background: "none", border: "none", textAlign: "left",
                              padding: "6px 10px", borderRadius: "var(--novae-radius-sm)",
                              fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                              color: "var(--novae-text-primary)", cursor: "pointer",
                            }}
                          >Custom</button>
                          {ALL_INFO_FIELDS.every((f) => activeInfoKeys.includes(f.key)) && customFields.length > 0 && (
                            <p style={{ margin: 0, padding: "6px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                              All fields added
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : undefined}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {visibleInfoFields.map(({ key, label, state, setter, dbVal, multiline }) => {
                      const value = editing ? state : dbVal;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: multiline ? "flex-start" : "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-secondary)", width: "45%", flexShrink: 0, paddingTop: multiline ? 6 : 0 }}>
                            {label}
                          </span>
                          {editing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <input value={state ?? ""} onChange={(e) => setter(e.target.value)} placeholder="—" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1 }} />
                                <button onClick={() => setActiveInfoKeys((prev) => prev.filter((k) => k !== key))} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>
                              {value?.startsWith("custom-") ? value.slice(7) : (value || "—")}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Custom fields */}
                    {editing ? customFields.map((cf) => (
                      <div key={cf.id} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <input
                          value={cf.name}
                          onChange={(e) => setCustomFields((prev) => prev.map((f) => f.id === cf.id ? { ...f, name: e.target.value } : f))}
                          placeholder="Field name…"
                          style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", fontWeight: 700, width: "45%", flexShrink: 0, color: "var(--novae-text-secondary)" }}
                        />
                        <div style={{ display: "flex", gap: 4, flex: 1 }}>
                          <textarea
                            value={cf.content}
                            onChange={(e) => setCustomFields((prev) => prev.map((f) => f.id === cf.id ? { ...f, content: e.target.value } : f))}
                            placeholder="Content…"
                            rows={3}
                            style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1, resize: "vertical", minHeight: 64 }}
                          />
                          <button onClick={() => setCustomFields((prev) => prev.filter((f) => f.id !== cf.id))} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "0 4px", alignSelf: "flex-start" }}>×</button>
                        </div>
                      </div>
                    )) : customFields.filter((cf) => cf.content).map((cf) => (
                      <div key={cf.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-secondary)", width: "45%", flexShrink: 0 }}>{cf.name || "Custom"}</span>
                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", whiteSpace: "pre-wrap" }}>{cf.content}</span>
                      </div>
                    ))}

                    {visibleInfoFields.length === 0 && customFields.length === 0 && !editing && (
                      <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                        No info yet.
                      </p>
                    )}
                  </div>
                </SectionCard>

                {/* Voice Claim */}
                <SectionCard title="Voice Claim">
                  {editing ? (
                    <>
                      <input
                        value={voiceClaimUrl}
                        onChange={(e) => setVoiceClaimUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                        placeholder="YouTube URL"
                        style={inputStyle}
                      />
                      {voiceClaimUrl && extractYoutubeId(voiceClaimUrl) && (
                        <div style={{ borderRadius: "var(--novae-radius-md)", overflow: "hidden", aspectRatio: "16/9" }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${extractYoutubeId(voiceClaimUrl)}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ width: "100%", height: "100%", border: "none" }}
                          />
                        </div>
                      )}
                    </>
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    {swatches.map((swatch, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <div
                          style={{
                            width: "100%", aspectRatio: "1 / 1",
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
                          width: "100%", aspectRatio: "1 / 1",
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
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", gridColumn: "1 / -1" }}>
                        No palette yet.
                      </p>
                    )}
                  </div>
                </SectionCard>
              </div>

              {/* Main content area */}
              <div className="char-body-main gap-6">
                {(() => {
                  const defaultOrder = ["latestImages", "storySummary", "music", ...customContainers.map((c) => `custom:${c.id}`)];
                  const visibility: Record<string, boolean> = {
                    latestImages: true,
                    storySummary: !!summary,
                    music: tracks.length > 0 || !!spotifyPlaylistUrl || editing,
                  };
                  customContainers.forEach((c) => { visibility[`custom:${c.id}`] = true; });

                  const known = new Set(defaultOrder);
                  const seen = new Set<string>();
                  const ordered: string[] = [];
                  const source = blockOrder.length > 0 ? blockOrder : defaultOrder;
                  for (const key of source) {
                    if (known.has(key) && !seen.has(key)) { ordered.push(key); seen.add(key); }
                  }
                  for (const key of defaultOrder) {
                    if (!seen.has(key)) { ordered.push(key); seen.add(key); }
                  }
                  const visibleKeys = ordered.filter((key) => visibility[key]);
                  const draggable = !!(isOwner && editing);

                  const renderBlock = (key: string): React.ReactNode => {
                    if (key === "latestImages") {
                      return (
                        <SectionCard
                          title="Latest Images"
                          action={
                            <button
                              onClick={() => setActiveTab("gallery")}
                              style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}
                            >
                              View more
                            </button>
                          }
                        >
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                            {latestImages.length > 0 ? latestImages.map((artwork) => (
                              <div
                                key={artwork.id}
                                onClick={() => setLightbox({ url: artwork.imageUrl, credits: artwork.credits })}
                                style={{
                                  aspectRatio: "1",
                                  borderRadius: "var(--novae-radius-md)",
                                  overflow: "hidden",
                                  backgroundColor: "var(--novae-bg-main)",
                                  position: "relative",
                                  cursor: "zoom-in",
                                }}
                              >
                                <SensitiveImageWrapper sensitiveType={artwork.sensitiveType} className="absolute inset-0">
                                  <Image src={artwork.thumbnailUrl ?? artwork.imageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 300px" className="object-cover" style={{ pointerEvents: "none" }} />
                                </SensitiveImageWrapper>
                                <SensitiveBadge sensitiveType={artwork.sensitiveType} side="left" />
                                {isOwner && (
                                  <div className="artwork-actions" style={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 3, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}>
                                    <button onClick={(e) => { e.stopPropagation(); openEditCredits(artwork); }} style={{ width: 24, height: 24, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit">
                                      <svg width="10" height="10" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteArtwork(artwork.id); }} style={{ width: 24, height: 24, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete">×</button>
                                  </div>
                                )}
                              </div>
                            )) : (
                              [1,2,3,4].map((i) => (
                                <div key={i} style={{ aspectRatio: "1", borderRadius: "var(--novae-radius-md)", backgroundColor: "var(--novae-bg-main)" }} />
                              ))
                            )}
                          </div>
                        </SectionCard>
                      );
                    }

                    if (key === "storySummary") {
                      return (
                        <SectionCard
                          title="Story"
                          action={
                            <button onClick={() => setActiveTab("story")} style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                              View more
                            </button>
                          }
                        >
                          <EditorRenderer content={summary} />
                        </SectionCard>
                      );
                    }

                    if (key === "music") {
                      return (
                        <SectionCard title="Music">
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {tracks.map((track, i) => (
                              <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", width: 20, textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
                                {editing ? (
                                  <>
                                    <input
                                      value={track.title}
                                      onChange={(e) => setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, title: e.target.value } : t))}
                                      placeholder="Title"
                                      style={{ ...inputStyle, flex: 2, fontSize: "var(--novae-text-sm)" }}
                                    />
                                    <input
                                      value={track.artist}
                                      onChange={(e) => setTracks((prev) => prev.map((t) => t.id === track.id ? { ...t, artist: e.target.value } : t))}
                                      placeholder="Artist"
                                      style={{ ...inputStyle, flex: 1, fontSize: "var(--novae-text-sm)" }}
                                    />
                                    <button
                                      onClick={() => setTracks((prev) => prev.filter((t) => t.id !== track.id))}
                                      style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
                                    >×</button>
                                  </>
                                ) : (
                                  <div style={{ display: "flex", flex: 1, gap: 8, alignItems: "baseline" }}>
                                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{track.title}</span>
                                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{track.artist}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {editing && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                                <button
                                  onClick={() => setTracks((prev) => [...prev, { id: crypto.randomUUID(), title: "", artist: "" }])}
                                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", padding: "6px 12px", cursor: "pointer" }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  Add a track
                                </button>
                                <PlaylistImport onImport={(imported) => setTracks((prev) => [...prev, ...imported])} />
                                {tracks.length > 0 && (
                                  <button
                                    onClick={() => setTracks([])}
                                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", padding: "6px 12px", cursor: "pointer" }}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    Clear playlist
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Spotify embed */}
                            {(() => {
                              const spotifyId = spotifyPlaylistUrl.trim().match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
                              return (
                                <>
                                  {spotifyId && !editing && (
                                    <iframe
                                      src={`https://open.spotify.com/embed/playlist/${spotifyId}?utm_source=generator&theme=0`}
                                      width="100%"
                                      height="352"
                                      frameBorder="0"
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"
                                      style={{ borderRadius: "var(--novae-radius-md)", marginTop: tracks.length > 0 ? 12 : 0 }}
                                    />
                                  )}
                                  {editing && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: tracks.length > 0 ? 8 : 0 }}>
                                      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                                        Spotify playlist URL
                                      </label>
                                      <input
                                        value={spotifyPlaylistUrl}
                                        onChange={(e) => setSpotifyPlaylistUrl(e.target.value)}
                                        placeholder="https://open.spotify.com/playlist/…"
                                        style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                                      />
                                      {spotifyId && (
                                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                                          ✓ Playlist detected
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </SectionCard>
                      );
                    }

                    if (key.startsWith("custom:")) {
                      const containerId = key.slice("custom:".length);
                      const container = customContainers.find((c) => c.id === containerId);
                      if (!container) return null;
                      return (
                        <SectionCard
                          title={
                            editing ? (
                              <input
                                value={container.title}
                                placeholder="Section title"
                                onChange={(e) => setCustomContainers((prev) =>
                                  prev.map((c) => c.id === container.id ? { ...c, title: e.target.value } : c)
                                )}
                                style={{
                                  background: "none", border: "none", outline: "none",
                                  fontFamily: "var(--font-space-grotesk)",
                                  fontSize: "var(--novae-text-base)",
                                  fontWeight: 700,
                                  color: "var(--novae-text-primary)",
                                  width: "100%",
                                  padding: 0,
                                }}
                              />
                            ) : container.title
                          }
                          action={
                            editing ? (
                              <button
                                onClick={() => setCustomContainers((prev) => prev.filter((c) => c.id !== container.id))}
                                style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
                              >×</button>
                            ) : undefined
                          }
                        >
                          {editing ? (
                            <>
                              <EditorField
                                value={container.content}
                                onChange={(val) => setCustomContainers((prev) =>
                                  prev.map((c) => c.id === container.id ? { ...c, content: val } : c)
                                )}
                                placeholder="Write something…"
                              />
                              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                <button
                                  onClick={save}
                                  disabled={saving}
                                  style={{ background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-sm)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, padding: "6px 16px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                                >
                                  {saving ? "Saving…" : "Save"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <EditorRenderer content={container.content} />
                          )}
                        </SectionCard>
                      );
                    }

                    return null;
                  };

                  return (
                    <DndContext
                      sensors={profileSensors}
                      onDragEnd={(e: DragEndEvent) => {
                        const { active, over } = e;
                        if (!over || active.id === over.id) return;
                        const oldIdx = visibleKeys.indexOf(active.id as string);
                        const newIdx = visibleKeys.indexOf(over.id as string);
                        if (oldIdx === -1 || newIdx === -1) return;
                        const reordered = arrayMove(visibleKeys, oldIdx, newIdx);
                        const hiddenKeys = ordered.filter((k) => !visibility[k]);
                        setBlockOrder([...reordered, ...hiddenKeys]);
                      }}
                    >
                      <SortableContext items={visibleKeys} strategy={verticalListSortingStrategy}>
                        {visibleKeys.map((key) => (
                          <SortableBlock key={key} id={key} draggable={draggable}>
                            {renderBlock(key)}
                          </SortableBlock>
                        ))}
                      </SortableContext>
                    </DndContext>
                  );
                })()}

                {isOwner && editing && (
                  <button
                    onClick={() => setCustomContainers((prev) => [...prev, { id: crypto.randomUUID(), title: "", content: "" }])}
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

          {/* Tab: Story */}
          {activeTab === "story" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary box */}
              <SectionCard title="Summary">
                {isOwner && editing ? (
                  <EditorField
                    value={summary}
                    onChange={setSummary}
                    placeholder="A short summary of the character…"
                  />
                ) : summary ? (
                  <EditorRenderer content={summary} />
                ) : (
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                    {isOwner ? "Add a summary to describe this character." : "No summary yet."}
                  </p>
                )}
              </SectionCard>

              {/* Full story */}
              <SectionCard title="Story">
                {isOwner && editing ? (
                  <EditorField
                    value={biography}
                    onChange={setBiography}
                    placeholder="Write the character's full story…"
                  />
                ) : biography ? (
                  <EditorRenderer content={biography} />
                ) : (
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                    {isOwner ? "Click Edit to write the full story." : "No story written yet."}
                  </p>
                )}
              </SectionCard>

              {isOwner && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 20px",
                    background: "var(--novae-btn-primary)", border: "none",
                    borderRadius: "var(--novae-radius-md)", color: "#fff",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                    fontWeight: 600, cursor: "pointer",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Edit story
                </button>
              )}
              {isOwner && editing && (
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={cancelEdit} style={{ padding: "10px 20px", background: "var(--novae-btn-secondary)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}>Cancel</button>
                  <button onClick={save} disabled={saving} style={{ padding: "10px 24px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab: Relationships */}
          {activeTab === "relationships" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isOwner && (
                <button
                  onClick={() => setShowAddRel(true)}
                  style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "10px 20px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add relationship
                </button>
              )}
              {relationships.length === 0 ? (
                <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>No relationships yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {relationships.map((rel) => {
                    const isExternal = !rel.character;
                    const imgSrc = isExternal
                      ? (rel.externalImageUrl ?? null)
                      : (rel.character?.avatarUrl ?? null);
                    const displayName = isExternal ? (rel.externalName ?? "?") : (rel.character?.name ?? "?");
                    const charHref = !isExternal && rel.character ? `/library/characters/${rel.character.numId}-${rel.character.slug}` : null;
                    return (
                    <div key={rel.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 12, position: "relative" }}>
                      <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", backgroundColor: "var(--novae-bg-main)" }}>
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbUrl(imgSrc, 128) ?? imgSrc} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {charHref
                          ? <a href={charHref} style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", textDecoration: "none", display: "block" }}>{displayName}</a>
                          : <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", display: "block" }}>{displayName}</span>
                        }
                        {!isExternal && rel.character?.user?.username && (
                          <span style={{ display: "block", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>by @{rel.character.user.username}</span>
                        )}
                        <span style={{ display: "inline-block", marginTop: 3, padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", background: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "var(--novae-text-tag)" }}>{rel.type}</span>
                        {rel.status === "pending" && (
                          <span style={{ display: "inline-block", marginTop: 3, marginLeft: 5, padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", background: "rgba(200,150,40,0.15)", fontFamily: "var(--font-dm-sans)", fontSize: "10px", fontWeight: 600, color: "#c89628" }}>⏳ Pending</span>
                        )}
                        {rel.description && <p style={{ margin: "6px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", lineHeight: 1.5 }}>{rel.description}</p>}
                      </div>
                      {isOwner && (
                        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                          <button
                            onClick={() => setEditingRel({ id: rel.id, isA: rel.isA, myLabel: rel.isA ? (rel.typeBRaw ?? "") : rel.typeRaw, otherLabel: rel.isA ? rel.typeRaw : (rel.typeBRaw ?? ""), description: rel.description ?? "" })}
                            style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 13, padding: "2px 5px" }}
                            title="Edit"
                          >
                            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button onClick={() => deleteRelationship(rel.id)} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 14, padding: "2px 5px" }}>×</button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

              {/* Add Relationship Modal */}
              {showAddRel && (
                <div style={{ position: "fixed", inset: 0, background: "transparent", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddRel(false); }}>
                  <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 24, width: 420, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>Add Relationship</h3>

                    {/* Mode toggle: site character vs external */}
                    <div style={{ display: "flex", borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
                      {([["site", "On Novae"], ["external", "External"]] as const).map(([m, label]) => (
                        <button
                          key={m}
                          onClick={() => { setRelMode(m); setRelUser(null); setRelUserSearch(""); setRelUserResults([]); setRelSelectedChar(null); setRelSearch(""); setRelSearchResults([]); setRelExternalName(""); setRelExternalImage(""); }}
                          style={{
                            flex: 1, padding: "8px 0",
                            background: relMode === m ? "var(--novae-btn-primary)" : "none",
                            border: "none",
                            color: relMode === m ? "#fff" : "var(--novae-text-secondary)",
                            fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                            fontWeight: relMode === m ? 600 : 400, cursor: "pointer",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Character source */}
                    {relMode === "site" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Step 1: choose user */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>1. Whose character?</label>
                          {relUser ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-selected)", borderRadius: "var(--novae-radius-md)" }}>
                              {relUser.avatar && <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(relUser.avatar, 56) ?? relUser.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", flex: 1 }}>
                                {relUser.id === currentUserId ? "Me" : (relUser.name ?? `@${relUser.username}`)}
                              </span>
                              <button onClick={() => { setRelUser(null); setRelSelectedChar(null); setRelSearch(""); setRelSearchResults([]); }} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 14 }}>×</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => pickRelUser(meUser)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", cursor: "pointer", textAlign: "left" }}>
                                {avatarUrl && <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(avatarUrl, 56) ?? avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", fontWeight: 600 }}>Me</span>
                              </button>
                              <div style={{ position: "relative" }}>
                                <input value={relUserSearch} onChange={(e) => { setRelUserSearch(e.target.value); searchRelUsers(e.target.value); }} placeholder="…or search another user" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                                {relUserLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--novae-text-secondary)", fontSize: 12 }}>…</span>}
                                {relUserResults.length > 0 && (
                                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", zIndex: 10, maxHeight: 240, overflowY: "auto" }}>
                                    {relUserResults.map((u) => (
                                      <button key={u.id} onClick={() => pickRelUser(u)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "var(--novae-bg-main)" }}>
                                          {u.avatar && <img src={thumbUrl(u.avatar, 56) ?? u.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>{u.name ?? u.username}</span>
                                        {u.username && <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>@{u.username}</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Step 2: choose character (once user is picked) */}
                        {relUser && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>2. Which character?</label>
                            {relSelectedChar ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-selected)", borderRadius: "var(--novae-radius-md)" }}>
                                {relSelectedChar.avatarUrl && <div style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(relSelectedChar.avatarUrl, 56) ?? relSelectedChar.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", flex: 1 }}>{relSelectedChar.name}</span>
                                <button onClick={() => setRelSelectedChar(null)} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 14 }}>×</button>
                              </div>
                            ) : (
                              <div style={{ position: "relative" }}>
                                <input value={relSearch} onChange={(e) => { setRelSearch(e.target.value); searchRelChars(e.target.value); }} onFocus={() => searchRelChars(relSearch)} placeholder="Type the character name…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                                {relSearchLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--novae-text-secondary)", fontSize: 12 }}>…</span>}
                                {relSearchResults.length > 0 && (
                                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", zIndex: 10, maxHeight: 240, overflowY: "auto" }}>
                                    {relSearchResults.map((c) => (
                                      <button key={c.id} onClick={() => { setRelSelectedChar(c); setRelSearch(""); setRelSearchResults([]); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}>
                                        <div style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--novae-bg-main)" }}>
                                          {c.avatarUrl && <img src={thumbUrl(c.avatarUrl, 56) ?? c.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                        </div>
                                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>{c.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {!relSearchLoading && relSearch.trim() && relSearchResults.length === 0 && (
                                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", marginTop: 4, display: "block" }}>No characters found for this user.</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                        {/* External image */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>Image</label>
                          <label style={{ width: 56, height: 56, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "var(--novae-bg-input)", border: "1px dashed var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                            {relExternalImage ? (
                              <img src={relExternalImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l5-5 4 4 3-3 6 6"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
                            )}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const uploaded = await startArtworkUpload([f]);
                              if (uploaded?.[0]?.ufsUrl) setRelExternalImage(uploaded[0].ufsUrl);
                              e.target.value = "";
                            }} />
                          </label>
                        </div>
                        {/* External name */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>Name</label>
                          <input value={relExternalName} onChange={(e) => setRelExternalName(e.target.value)} placeholder="Character name…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                        </div>
                      </div>
                    )}

                    {/* Relationship types */}
                    {relMode === "site" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
                        {/* This char → its label (shown on the other char's page) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {avatarUrl && <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(avatarUrl, 64) ?? avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{name}</span>
                          </div>
                          <input value={relTypeB} onChange={(e) => setRelTypeB(e.target.value)} placeholder="their label…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                        </div>

                        {/* Arrow */}
                        <div style={{ paddingBottom: 10, color: "var(--novae-text-secondary)", fontSize: 18 }}>⇄</div>

                        {/* Other char → its label (shown on this char's page) */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {relSelectedChar?.avatarUrl && <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(relSelectedChar.avatarUrl, 64) ?? relSelectedChar.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{relSelectedChar?.name ?? "Other"}</span>
                          </div>
                          <input value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="their label…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>Relationship label</label>
                        <input value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="their label…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-secondary)" }}>Description (optional)</label>
                      <textarea value={relDesc} onChange={(e) => setRelDesc(e.target.value)} placeholder="Describe the relationship…" rows={3} style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", resize: "vertical" }} />
                    </div>

                    {(() => {
                      const invalid = !relType.trim() || (relMode === "site" ? !relSelectedChar : !relExternalName.trim()) || relSaving;
                      return (
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button onClick={() => setShowAddRel(false)} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>Cancel</button>
                          <button onClick={addRelationship} disabled={invalid} style={{ padding: "8px 16px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer", opacity: invalid ? 0.5 : 1 }}>
                            {relSaving ? "Saving…" : "Add"}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Edit Relationship Modal */}
              {editingRel && (() => {
                const otherChar = relationships.find((r) => r.id === editingRel.id)?.character;
                return (
                  <div style={{ position: "fixed", inset: 0, background: "transparent", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) setEditingRel(null); }}>
                    <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 24, width: 460, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 20 }}>
                      <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>Edit Relationship</h3>

                      {/* Character row with labels */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
                        {/* This char */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {avatarUrl && <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(avatarUrl, 64) ?? avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{name}</span>
                          </div>
                          <input value={editingRel.myLabel} onChange={(e) => setEditingRel((r) => r && { ...r, myLabel: e.target.value, error: undefined })} placeholder="their label…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                        </div>

                        {/* Arrow */}
                        <div style={{ paddingBottom: 10, color: "var(--novae-text-secondary)", fontSize: 18 }}>⇄</div>

                        {/* Other char */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {otherChar?.avatarUrl && <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}><img src={thumbUrl(otherChar.avatarUrl, 64) ?? otherChar.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{otherChar?.name ?? "Other"}</span>
                          </div>
                          <input value={editingRel.otherLabel} onChange={(e) => setEditingRel((r) => r && { ...r, otherLabel: e.target.value, error: undefined })} placeholder="their label…" style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 600, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Description (optional)</label>
                        <textarea value={editingRel.description} onChange={(e) => setEditingRel((r) => r && { ...r, description: e.target.value, error: undefined })} placeholder="Describe the relationship…" rows={3} style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", resize: "vertical" }} />
                      </div>

                      {editingRel.error && (
                        <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "#e55" }}>{editingRel.error}</p>
                      )}

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setEditingRel(null)} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>Cancel</button>
                        <button onClick={saveEditRel} disabled={!(editingRel.isA ? editingRel.otherLabel : editingRel.myLabel).trim() || relSaving} style={{ padding: "8px 16px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer", opacity: (!(editingRel.isA ? editingRel.otherLabel : editingRel.myLabel).trim() || relSaving) ? 0.5 : 1 }}>
                          {relSaving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Tab: Timeline */}
          {activeTab === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 0", gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)" }}>Timeline coming soon.</p>
            </div>
          )}

          {/* Tab: Gallery */}
          {activeTab === "gallery" && (() => {
              const galleryImageStyle: React.CSSProperties = {
                position: "relative", aspectRatio: "1",
                borderRadius: "var(--novae-radius-md)", overflow: "hidden",
                backgroundColor: "var(--novae-bg-card)", cursor: "zoom-in",
              };

              const assignToGallery = async (artworkId: string, galleryId: string) => {
                const inGallery = galleries.find((g) => g.id === galleryId)?.images.some((i) => i.artworkId === artworkId);
                if (inGallery) return;
                const res = await fetch(`/api/characters/${character.id}/galleries/${galleryId}`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ artworkId }),
                });
                if (res.ok) setGalleries((prev) => prev.map((gal) =>
                  gal.id === galleryId ? { ...gal, images: [...gal.images, { id: Math.random().toString(), artworkId, order: 0 }] } : gal
                ));
              };

              const uncategorized = artworks.filter((a) => !galleries.some((g) => g.images.some((i) => i.artworkId === a.id)));

              const tileProps = { isOwner, galleries, characterId: character.id, assigningArtwork, setAssigningArtwork, setLightbox, openEditCredits, deleteArtwork, setGalleries, isDndActive: galleries.length > 0, selectMode, onToggleSelect: toggleSelectArtwork };

              const reorderGalleries = (activeId: string, overId: string) => {
                const oldIdx = galleries.findIndex((g) => g.id === activeId);
                const newIdx = galleries.findIndex((g) => g.id === overId);
                if (oldIdx === -1 || newIdx === -1) return;
                const reordered = arrayMove(galleries, oldIdx, newIdx);
                setGalleries(reordered);
                fetch(`/api/characters/${character.id}/galleries/reorder`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ids: reordered.map((g) => g.id) }),
                });
              };

              return (
                <DndContext
                  sensors={gallerySensors}
                  onDragStart={(e) => setGalleryDragId(e.active.id as string)}
                  onDragOver={(e) => setGalleryOverId(e.over?.id as string ?? null)}
                  onDragEnd={(e: DragEndEvent) => {
                    setGalleryDragId(null); setGalleryOverId(null);
                    const { active, over } = e;
                    if (!over) return;
                    const activeId = active.id as string;
                    const overId = over.id as string;
                    if (!activeId.startsWith("artwork-")) {
                      if (activeId !== overId) reorderGalleries(activeId, overId);
                      return;
                    }
                    const artworkId = activeId.replace("artwork-", "");
                    if (galleries.some((g) => g.id === overId)) assignToGallery(artworkId, overId);
                  }}
                  onDragCancel={() => { setGalleryDragId(null); setGalleryOverId(null); }}
                >
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

                  {/* ── Toolbar ─────────────────────────────────── */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {isOwner && (
                      <button onClick={() => artworkFileRef.current?.click()} disabled={uploadingImage} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: uploadingImage ? "not-allowed" : "pointer", opacity: uploadingImage ? 0.7 : 1 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        {uploadingImage ? "Uploading…" : "Add images"}
                      </button>
                    )}
                    {isOwner && !creatingGallery && (
                      <button onClick={() => setCreatingGallery(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New category
                      </button>
                    )}
                    {isOwner && creatingGallery && (
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newGalleryName.trim()) return;
                        const res = await fetch(`/api/characters/${character.id}/galleries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newGalleryName.trim() }) });
                        if (res.ok) { const g = await res.json(); setGalleries((prev) => [...prev, g]); }
                        setNewGalleryName(""); setCreatingGallery(false);
                      }} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input autoFocus value={newGalleryName} onChange={(e) => setNewGalleryName(e.target.value)} placeholder="Category name…" style={{ padding: "7px 10px", background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", outline: "none" }} />
                        <button type="submit" style={{ padding: "7px 12px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer" }}>Create</button>
                        <button type="button" onClick={() => { setCreatingGallery(false); setNewGalleryName(""); }} style={{ padding: "7px 10px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>Cancel</button>
                      </form>
                    )}
                    {isOwner && artworks.length > 0 && (
                      <button
                        onClick={() => { if (selectMode) clearSelection(); else setSelectMode(true); }}
                        style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: selectMode ? "var(--novae-btn-primary)" : "none", border: `1px solid ${selectMode ? "var(--novae-btn-primary)" : "var(--novae-outline-all)"}`, borderRadius: "var(--novae-radius-md)", color: selectMode ? "#fff" : "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}
                      >
                        {selectMode ? "Cancel" : "Select"}
                      </button>
                    )}
                  </div>

                  {/* ── Bulk selection toolbar ───────────────────── */}
                  {selectMode && selectedArtworkIds.size > 0 && (
                    <div style={{ position: "sticky", top: 8, zIndex: 30, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-selected)", borderRadius: "var(--novae-radius-md)" }}>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)" }}>
                        {selectedArtworkIds.size} selected
                      </span>
                      {galleries.length > 0 && (
                        <select
                          value={bulkMoveGalleryId}
                          onChange={(e) => { const gid = e.target.value; setBulkMoveGalleryId(gid); if (gid) bulkMoveToGallery(gid); }}
                          style={{ padding: "6px 10px", background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}
                        >
                          <option value="">Move to category…</option>
                          {galleries.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      )}
                      <button onClick={bulkDeleteArtworks} style={{ padding: "7px 14px", background: "var(--novae-error, #d64545)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer" }}>
                        Delete selected
                      </button>
                      <button onClick={() => setSelectedArtworkIds(new Set())} style={{ padding: "7px 12px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                        Deselect all
                      </button>
                    </div>
                  )}

                  {/* ── Gallery sections ─────────────────────────── */}
                  <SortableContext items={galleries.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                  {galleries.map((g) => {
                    const isCollapsed = collapsedGalleries[g.id] ?? false;
                    const toggle = () => setCollapsedGalleries((prev) => ({ ...prev, [g.id]: !prev[g.id] }));
                    const galleryArtworks = artworks.filter((a) => g.images.some((i) => i.artworkId === a.id));
                    const isOver = galleryOverId === g.id;
                    return (
                      <SortableGallerySection key={g.id} galleryId={g.id} draggable={isOwner && galleries.length > 1} isOver={isOver}>
                        {(dragHandle) => (
                        <>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isCollapsed ? 0 : 16 }}>
                          {isOwner && galleries.length > 1 && (
                            <div
                              {...dragHandle.attributes}
                              {...dragHandle.listeners}
                              title="Drag to reorder"
                              style={{ display: "flex", alignItems: "center", cursor: "grab", touchAction: "none", color: "var(--novae-text-secondary)", opacity: 0.6 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                                <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                              </svg>
                            </div>
                          )}
                          <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--novae-text-secondary)" }}><polyline points="6 9 12 15 18 9"/></svg>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--novae-text-link)" }}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {renamingGallery?.id === g.id ? (
                              <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!renamingGallery.name.trim()) return;
                                const res = await fetch(`/api/characters/${character.id}/galleries/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renamingGallery.name.trim() }) });
                                if (res.ok) setGalleries((prev) => prev.map((gal) => gal.id === g.id ? { ...gal, name: renamingGallery.name.trim() } : gal));
                                setRenamingGallery(null);
                              }} onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 4 }}>
                                <input autoFocus value={renamingGallery.name} onChange={(e) => setRenamingGallery((r) => r && { ...r, name: e.target.value })} style={{ padding: "3px 8px", background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", outline: "none", width: 140 }} />
                                <button type="submit" style={{ padding: "3px 8px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-sm)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", cursor: "pointer" }}>✓</button>
                                <button type="button" onClick={() => setRenamingGallery(null)} style={{ padding: "3px 8px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", cursor: "pointer" }}>✕</button>
                              </form>
                            ) : (
                              <>
                                <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{g.name}</span>
                                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{galleryArtworks.length}</span>
                              </>
                            )}
                          </button>
                          {isOwner && (
                            <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                              <button onClick={() => setRenamingGallery({ id: g.id, name: g.name })} title="Rename" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: 0.6 }}>
                                <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </button>
                              <button onClick={async () => {
                                if (!confirm(`Delete category "${g.name}"? Images won't be deleted.`)) return;
                                const res = await fetch(`/api/characters/${character.id}/galleries/${g.id}`, { method: "DELETE" });
                                if (res.ok) setGalleries((prev) => prev.filter((gal) => gal.id !== g.id));
                              }} title="Delete category" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: 0.6, fontSize: 16 }}>×</button>
                            </div>
                          )}
                        </div>
                        {!isCollapsed && (
                          galleryArtworks.length === 0 ? (
                            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: isOver ? "var(--novae-text-link)" : "var(--novae-text-secondary)", margin: 0, paddingLeft: 4 }}>
                              {isOver ? "Drop here to add to this category" : "Empty — drag an image here or use the folder icon."}
                            </p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {galleryArtworks.map((a) => <DraggableArtworkTile key={a.id} artwork={a} {...tileProps} isSelected={selectedArtworkIds.has(a.id)} />)}
                            </div>
                          )
                        )}
                        </>
                        )}
                      </SortableGallerySection>
                    );
                  })}
                  </SortableContext>

                  {/* ── Uncategorized ────────────────────────────── */}
                  {(galleries.length === 0 || uncategorized.length > 0) && (
                    <div>
                      {galleries.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-secondary)" }}>Uncategorized</span>
                          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{uncategorized.length}</span>
                        </div>
                      )}
                      {uncategorized.length === 0 ? (
                        <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
                          No images yet.{isOwner ? ' Click "Add images" to get started.' : ""}
                        </p>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                          {uncategorized.map((a) => <DraggableArtworkTile key={a.id} artwork={a} {...tileProps} isSelected={selectedArtworkIds.has(a.id)} />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <DragOverlay>
                  {galleryDragId && (() => {
                    const artworkId = galleryDragId.replace("artwork-", "");
                    const artwork = artworks.find((a) => a.id === artworkId);
                    return artwork ? (
                      <div style={{ position: "relative", width: 120, height: 120, borderRadius: "var(--novae-radius-md)", overflow: "hidden", transform: "rotate(2deg)", opacity: 0.9, pointerEvents: "none" }}>
                        <Image src={artwork.imageUrl} alt="" fill sizes="120px" className="object-cover" />
                      </div>
                    ) : null;
                  })()}
                </DragOverlay>
                </DndContext>
              );
          })()}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────── */}
        <aside
          className="char-body-side"
          style={{
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
                { count: artworks.length, label: t.statLabelImages },
                { count: relationships.length, label: t.statLabelRelationships },
                { count: favoritesCount, label: t.statLabelFavorites },
                { count: tags.length, label: t.statLabelTags },
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
                  <Link
                    href={`/browse/characters?tag=${encodeURIComponent(tag.name)}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    #{tag.name}
                  </Link>
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
                  <TagSearch
                    value={tagInput}
                    onChange={setTagInput}
                    onSelect={(name) => addTag(name)}
                    placeholder="Add a tag…"
                    inputStyle={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                    disabled={addingTag}
                  />
                  <button
                    onClick={() => addTag()}
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

          {/* Relationships */}
          <SectionCard
            title="Relationships"
            action={
              <button onClick={() => setActiveTab("relationships")} style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                View more
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {relationships.slice(0, 3).map((rel) => (
                <RelCard key={rel.id} rel={rel} />
              ))}
              {relationships.length === 0 && (
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>No relationships yet.</p>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>

      {/* Hover show delete button on artwork */}
      <style>{`
        .artwork-delete-btn { opacity: 0 !important; }
        div:hover > .artwork-delete-btn { opacity: 1 !important; }
        .artwork-actions { opacity: 0 !important; }
        div:hover > .artwork-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function RelCard({ rel }: { rel: { id: string; type: string; description: string | null; character: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null } | null; externalName?: string | null; externalImageUrl?: string | null } }) {
  const isExternal = !rel.character;
  const href = rel.character ? `/library/characters/${rel.character.numId}-${rel.character.slug}` : null;
  const imgSrc = isExternal ? (rel.externalImageUrl ?? null) : (rel.character?.avatarUrl ?? null);
  const displayName = isExternal ? (rel.externalName ?? "?") : (rel.character?.name ?? "?");
  const avatar = imgSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={thumbUrl(imgSrc, 128) ?? imgSrc} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
  ) : null;
  const avatarBox = { width: 48, height: 48, flexShrink: 0, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", backgroundColor: "var(--novae-bg-main)", display: "block" } as const;
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      {href ? <a href={href} style={avatarBox}>{avatar}</a> : <div style={avatarBox}>{avatar}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        {href
          ? <a href={href} style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", textDecoration: "none", display: "block" }}>{displayName}</a>
          : <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", display: "block" }}>{displayName}</span>
        }
        <span style={{ display: "inline-block", marginTop: 2, padding: "1px 7px", borderRadius: "var(--novae-radius-sm)", background: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "var(--novae-text-tag)" }}>{rel.type}</span>
        {rel.description && <p style={{ margin: "4px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>{rel.description}</p>}
      </div>
    </div>
  );
}

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
