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
type Artwork = { id: string; imageUrl: string; thumbnailUrl: string | null; sensitiveType: string | null; worlds: { id: string; name: string; numId: number; slug: string }[]; credits: ArtworkCreditData[] };

type RawCredit = { id: string; userId: string | null; label: string | null; url: string | null; user: { username: string | null } | null };
function mapCredits(raw: RawCredit[]): ArtworkCreditData[] {
  return raw.map((c) => ({ id: c.id, userId: c.userId, username: c.user?.username ?? null, label: c.label, url: c.url }));
}

type CharacterInWorld = { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; user?: { username: string | null } };

interface WorldData {
  id: string;
  numId: number;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  isDesigner: boolean;
  designerCredit: string | null;
  isWriter: boolean;
  writerCredit: string | null;
  summary: string | null;
  biography: string | null;
  sections: string | null;
  profileBlockOrder: string | null;
  createdAt: Date;
  creator: { username: string | null };
  locations: { id: string; name: string; description: string | null; x: number | null; y: number | null }[];
  characters: CharacterInWorld[];
  maps: { id: string; name: string; imageUrl: string | null; bounds: unknown }[];
  artworks: Artwork[];
  tags: Tag[];
  colorPalettes: { id: string; swatches: Swatch[] }[];
  favorites: { id: string }[];
  galleries: { id: string; name: string; images: { id: string; artworkId: string; order: number }[] }[];
  baseWorld: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; isPublic: boolean; variants: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; variantLabel: string | null; isPublic: boolean }[] } | null;
  variants: { id: string; name: string; numId: number; slug: string; avatarUrl: string | null; variantLabel: string | null; isPublic: boolean }[];
}

interface Props {
  world: WorldData;
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
        placeholder="Label (e.g. Sky)"
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

// ─── Gallery DnD sub-components ──────────────────────────────────────────────

type GalleryData = { id: string; name: string; images: { id: string; artworkId: string; order: number }[] };

function DraggableArtworkTile({
  artwork, isOwner, galleries, worldId, assigningArtwork, setAssigningArtwork,
  setLightbox, openEditCredits, deleteArtwork, setGalleries, isDndActive,
  selectMode, isSelected, onToggleSelect,
}: {
  artwork: Artwork;
  isOwner: boolean;
  galleries: GalleryData[];
  worldId: string;
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
                  const res = await fetch(`/api/worlds/${worldId}/galleries/${g.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId: artwork.id, remove: inGallery }) });
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

export default function WorldPageClient({ world, isOwner, currentUserId, initialFavorited = false }: Props) {
  const router = useRouter();
  const { t } = useT();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "lore" | "inhabitants" | "gallery" | "map" | "timeline">("profile");
  const [showAuModal, setShowAuModal] = useState(false);
  const [auName, setAuName] = useState("");
  const [auLabel, setAuLabel] = useState("");
  const [creatingAu, setCreatingAu] = useState(false);

  // "Star" topology: every AU points to the root world. The switcher always shows
  // [root, ...all variants of root], regardless of which one is currently open.
  const rootWorld = world.baseWorld
    ? { id: world.baseWorld.id, name: world.baseWorld.name, numId: world.baseWorld.numId, slug: world.baseWorld.slug, avatarUrl: world.baseWorld.avatarUrl }
    : { id: world.id, name: world.name, numId: world.numId, slug: world.slug, avatarUrl: world.avatarUrl };
  const auVariants = world.baseWorld ? world.baseWorld.variants : world.variants;

  const worldUrl = (numId: number, slug: string) => `/library/worlds/${numId}-${slug}`;

  const createAlternateUniverse = useCallback(async () => {
    if (!auName.trim()) return;
    setCreatingAu(true);
    try {
      const res = await fetch("/api/worlds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: auName.trim(),
          baseWorldId: rootWorld.id,
          variantLabel: auLabel.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const created = await res.json();
      setShowAuModal(false);
      setAuName("");
      setAuLabel("");
      router.push(`/library/worlds/${created.id}`);
    } catch {
      // no-op: keep modal open so the user can retry
    } finally {
      setCreatingAu(false);
    }
  }, [auName, auLabel, rootWorld.id, router]);

  const [auToDelete, setAuToDelete] = useState<{ id: string; label: string; isViewingIt: boolean } | null>(null);
  const [deletingAu, setDeletingAu] = useState(false);

  const confirmDeleteAlternateUniverse = useCallback(async () => {
    if (!auToDelete) return;
    setDeletingAu(true);
    try {
      const res = await fetch(`/api/worlds/${auToDelete.id}`, { method: "DELETE" });
      if (!res.ok) return;
      if (auToDelete.isViewingIt) {
        router.push(`/library/worlds/${rootWorld.id}`);
      } else {
        router.refresh();
      }
      setAuToDelete(null);
    } finally {
      setDeletingAu(false);
    }
  }, [auToDelete, rootWorld.id, router]);

  // Edit state mirrors the DB fields
  const [name, setName] = useState(world.name);
  const [description, setDescription] = useState(world.description ?? "");

  // Designer / Writer credit edit state
  const parseCredit = (raw: string | null): { type: "onsite" | "offsite"; value: string; label: string } => {
    if (!raw) return { type: "onsite", value: "", label: "" };
    if (raw.startsWith("@")) return { type: "onsite", value: raw.slice(1), label: "" };
    const m = raw.match(/^\[(.+)\]\((.+)\)$/);
    if (m) return { type: "offsite", value: m[2], label: m[1] };
    return { type: "onsite", value: raw, label: "" };
  };
  const [isDesigner, setIsDesigner] = useState(world.isDesigner);
  const parsed = parseCredit(world.designerCredit);
  const [creditType, setCreditType] = useState<"onsite" | "offsite">(parsed.type);
  const [creditValue, setCreditValue] = useState(parsed.value);
  const [creditLabel, setCreditLabel] = useState(parsed.label);
  const [isWriter, setIsWriter] = useState(world.isWriter);
  const parsedWriter = parseCredit(world.writerCredit);
  const [writerType, setWriterType] = useState<"onsite" | "offsite">(parsedWriter.type);
  const [writerValue, setWriterValue] = useState(parsedWriter.value);
  const [writerLabel, setWriterLabel] = useState(parsedWriter.label);
  const [summary, setSummary] = useState(world.summary ?? "");
  const [biography, setBiography] = useState(world.biography ?? "");
  const [avatarUrl, setAvatarUrl] = useState(world.avatarUrl ?? "");
  const [isPublic, setIsPublic] = useState(world.isPublic);

  // Tags
  const [tags, setTags] = useState<Tag[]>(world.tags);
  const [tagInput, setTagInput] = useState("");
  const [addingTag, setAddingTag] = useState(false);

  // Palette
  const initialSwatches = world.colorPalettes[0]?.swatches ?? [];
  const [swatches, setSwatches] = useState<Swatch[]>(initialSwatches);
  const [editingSwatch, setEditingSwatch] = useState<number | null>(null);

  // Artworks
  const [artworks, setArtworks] = useState<Artwork[]>(world.artworks);
  const [uploadingImage, setUploadingImage] = useState(false);
  const artworkFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Crop modals
  const [avatarCropSrc, setAvatarCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [artworkCropSrc, setArtworkCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [artworkThumbnailFile, setArtworkThumbnailFile] = useState<File | null>(null);

  // Creator modal
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [pendingIsAvatar, setPendingIsAvatar] = useState(false);
  const [pendingCredits, setPendingCredits] = useState<CreditDraft[]>([emptyCredit()]);
  const [pendingSensitiveType, setPendingSensitiveType] = useState<string | null>(null);

  const { startUpload: startArtworkUpload } = useUploadThing("worldImage");
  const { startUpload: startAvatarUpload } = useUploadThing("worldAvatar");
  const { startUpload: startMapUpload } = useUploadThing("worldMap");

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; credits: ArtworkCreditData[] } | null>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Galleries
  const [galleries, setGalleries] = useState<GalleryData[]>(world.galleries ?? []);
  const [collapsedGalleries, setCollapsedGalleries] = useState<Record<string, boolean>>({});
  const [galleryDragId, setGalleryDragId] = useState<string | null>(null);
  const [galleryOverId, setGalleryOverId] = useState<string | null>(null);
  const gallerySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [newGalleryName, setNewGalleryName] = useState("");
  const [creatingGallery, setCreatingGallery] = useState(false);
  const [renamingGallery, setRenamingGallery] = useState<{ id: string; name: string } | null>(null);
  const [assigningArtwork, setAssigningArtwork] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<Set<string>>(new Set());
  const [bulkMoveGalleryId, setBulkMoveGalleryId] = useState<string>("");

  // Inhabitants — characters belonging to this world
  const [inhabitants, setInhabitants] = useState<CharacterInWorld[]>(world.characters ?? []);
  const [showAddInhabitant, setShowAddInhabitant] = useState(false);
  const [inhabitantSearch, setInhabitantSearch] = useState("");
  const [inhabitantResults, setInhabitantResults] = useState<CharacterInWorld[]>([]);
  const [inhabitantSearchLoading, setInhabitantSearchLoading] = useState(false);
  const [inhabitantSaving, setInhabitantSaving] = useState(false);

  const searchInhabitants = async (q: string) => {
    handleInhabitantSearch(q);
  };

  // Maps state
  const [maps, setMaps] = useState<{ id: string; name: string; imageUrl: string | null; bounds: unknown }[]>(world.maps ?? []);
  const [uploadingMap, setUploadingMap] = useState(false);
  const mapFileRef = useRef<HTMLInputElement>(null);

  // Custom containers
  type Container = { id: string; title: string; content: string };

  const parseContainers = (): Container[] => {
    if (!world.sections) return [];
    try { return JSON.parse(world.sections); } catch { return []; }
  };

  const [customContainers, setCustomContainers] = useState<Container[]>(parseContainers);

  // Middle-column block order (drag & drop, Profile tab)
  const parseBlockOrder = (): string[] => {
    if (!world.profileBlockOrder) return [];
    try {
      const parsed = JSON.parse(world.profileBlockOrder);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  };
  const [blockOrder, setBlockOrder] = useState<string[]>(parseBlockOrder);
  const profileSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Edit credits modal
  const [editingCredits, setEditingCredits] = useState<Artwork | null>(null);
  const [creditsDrafts, setCreditsDrafts] = useState<CreditDraft[]>([emptyCredit()]);
  const [creditsWorlds, setCreditsWorlds] = useState<{ id: string; name: string; numId: number; slug: string }[]>([]);
  const [creditsWorldSearch, setCreditsWorldSearch] = useState("");
  const [creditsWorldResults, setCreditsWorldResults] = useState<{ id: string; name: string; numId: number; slug: string }[]>([]);
  const [creditsWorldLoading, setCreditsWorldLoading] = useState(false);
  const [creditsSensitiveType, setCreditsSensitiveType] = useState<string | null>(null);
  // Thumbnail editing inside edit-credits modal
  const [editThumbCropSrc, setEditThumbCropSrc] = useState<{ src: string; file: File } | null>(null);
  const [editThumbFile, setEditThumbFile] = useState<File | null>(null);
  const [editThumbPreview, setEditThumbPreview] = useState<string | null>(null);
  const [editThumbRemoved, setEditThumbRemoved] = useState(false);

  // Favorite
  const [favorited, setFavorited] = useState(initialFavorited);
  const [favoritesCount, setFavoritesCount] = useState(world.favorites.length);
  const [favLoading, setFavLoading] = useState(false);

  // ── Search inhabitants ─────────────────────────────────────────────────────

  const handleInhabitantSearch = async (q: string) => {
    setInhabitantSearchLoading(true);
    try {
      const params = new URLSearchParams({ scope: "all", limit: "20" });
      if (q.trim()) params.set("search", q.trim());
      const res = await fetch(`/api/characters?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const chars = (data.characters ?? data) as CharacterInWorld[];
        setInhabitantResults(chars.filter((c) => !inhabitants.some((i) => i.id === c.id)));
      }
    } finally {
      setInhabitantSearchLoading(false);
    }
  };

  const addInhabitant = async (characterId: string) => {
    setInhabitantSaving(true);
    try {
      const res = await fetch(`/api/worlds/${world.id}/relationships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (res.ok) {
        router.refresh();
        setShowAddInhabitant(false);
      }
    } finally {
      setInhabitantSaving(false);
    }
  };

  const removeInhabitant = async (characterId: string) => {
    if (!confirm("Remove this character from the world?")) return;
    const res = await fetch(`/api/worlds/${world.id}/relationships/${characterId}`, { method: "DELETE" });
    if (res.ok) {
      setInhabitants((prev) => prev.filter((c) => c.id !== characterId));
      router.refresh();
    }
  };

  // ── Map upload ────────────────────────────────────────────────────────────

  const uploadMap = async (file: File) => {
    setUploadingMap(true);
    try {
      const uploaded = await startMapUpload([file]);
      if (!uploaded?.length) return;
      const url = uploaded[0].url;
      const res = await fetch(`/api/worlds/${world.id}/maps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, "") || "Map", imageUrl: url }),
      });
      if (res.ok) {
        const map = await res.json();
        setMaps((prev) => [...prev, map]);
        router.refresh();
      }
    } finally {
      setUploadingMap(false);
    }
  };

  const deleteMap = async (mapId: string) => {
    if (!confirm("Delete this map?")) return;
    const res = await fetch(`/api/worlds/${world.id}/maps/${mapId}`, { method: "DELETE" });
    if (res.ok) {
      setMaps((prev) => prev.filter((m) => m.id !== mapId));
      router.refresh();
    }
  };

  // ── Save handler ──────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const worldRes = await fetch(`/api/worlds/${world.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description,
          sections: customContainers.length > 0 ? JSON.stringify(customContainers) : null,
          profileBlockOrder: blockOrder.length > 0 ? JSON.stringify(blockOrder) : null,
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
      const worldData = worldRes.ok ? await worldRes.json() : null;

      // Save palette
      await fetch(`/api/worlds/${world.id}/palette`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swatches }),
      });

      setEditing(false);
      if (worldData?.numId && worldData?.slug && worldData.slug !== world.slug) {
        router.replace(`/library/worlds/${worldData.numId}-${worldData.slug}`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [world.id, name, description, customContainers, blockOrder, summary, biography, avatarUrl, isPublic, isDesigner, creditType, creditValue, creditLabel, isWriter, writerType, writerValue, writerLabel, swatches, router]);

  const cancelEdit = () => {
    setName(world.name);
    setDescription(world.description ?? "");
    setIsDesigner(world.isDesigner);
    const p = parseCredit(world.designerCredit);
    setCreditType(p.type); setCreditValue(p.value); setCreditLabel(p.label);
    setIsWriter(world.isWriter);
    const pw = parseCredit(world.writerCredit);
    setWriterType(pw.type); setWriterValue(pw.value); setWriterLabel(pw.label);
    setCustomContainers(parseContainers());
    setAvatarUrl(world.avatarUrl ?? "");
    setSummary(world.summary ?? "");
    setBiography(world.biography ?? "");
    setIsPublic(world.isPublic);
    setSwatches(initialSwatches);
    setEditing(false);
  };

  // ── Tag handlers ──────────────────────────────────────────────────────────

  const addTag = async (name?: string) => {
    const raw = (name ?? tagInput).trim();
    if (!raw) return;
    setAddingTag(true);
    try {
      const res = await fetch(`/api/worlds/${world.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: raw }),
      });
      if (res.ok) {
        const tag = await res.json();
        const newWorldTag: Tag = { tagId: tag.id, tag };
        setTags((prev) => [...prev.filter((t) => t.tagId !== tag.id), newWorldTag]);
        setTagInput("");
      }
    } finally {
      setAddingTag(false);
    }
  };

  const removeTag = async (tagId: string) => {
    await fetch(`/api/worlds/${world.id}/tags/${tagId}`, { method: "DELETE" });
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
        const url = uploaded[0].url;
        setAvatarUrl(url);
        await fetch(`/api/worlds/${world.id}`, {
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
          thumbnailUrl = thumbUploaded?.[0]?.url ?? null;
        }

        const creditsPayload = (credits ?? []).map((c) => ({ type: c.type, value: c.value.trim(), label: c.label.trim() }));

        for (const file of uploaded) {
          const res = await fetch(`/api/worlds/${world.id}/artworks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: file.url,
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
    await fetch(`/api/worlds/${world.id}/artworks/${artworkId}`, { method: "DELETE" });
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
    await Promise.all(ids.map((id) => fetch(`/api/worlds/${world.id}/artworks/${id}`, { method: "DELETE" })));
    setArtworks((prev) => prev.filter((a) => !selectedArtworkIds.has(a.id)));
    clearSelection();
  };

  const bulkMoveToGallery = async (galleryId: string) => {
    const ids = Array.from(selectedArtworkIds);
    if (ids.length === 0 || !galleryId) return;
    await Promise.all(ids.map((id) => fetch(`/api/worlds/${world.id}/galleries/${galleryId}`, {
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
    setCreditsWorlds(artwork.worlds ?? []);
    setCreditsSensitiveType(artwork.sensitiveType ?? null);
    setCreditsWorldSearch("");
    setCreditsWorldResults([]);
    setEditThumbFile(null);
    setEditThumbPreview(null);
    setEditThumbRemoved(false);
    setEditingCredits(artwork);
  };

  const searchCreditsWorlds = async (q: string) => {
    setCreditsWorldSearch(q);
    if (!q.trim()) { setCreditsWorldResults([]); return; }
    setCreditsWorldLoading(true);
    try {
      const params = new URLSearchParams({ scope: "all", search: q.trim(), limit: "8" });
      const res = await fetch(`/api/worlds?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCreditsWorldResults((Array.isArray(data) ? data : []).filter((w: { id: string }) => w.id !== world.id));
      }
    } finally {
      setCreditsWorldLoading(false);
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
      newThumbnailUrl = uploaded?.[0]?.url ?? null;
    }

    const body: Record<string, unknown> = { credits, worldIds: creditsWorlds.map((w) => w.id), sensitiveType: creditsSensitiveType };
    if (newThumbnailUrl !== undefined) body.thumbnailUrl = newThumbnailUrl;

    const res = await fetch(`/api/worlds/${world.id}/artworks/${editingCredits.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setArtworks((prev) => prev.map((a) => a.id === editingCredits.id
        ? { ...a, credits: mapCredits(updated.credits), worlds: creditsWorlds, thumbnailUrl: newThumbnailUrl !== undefined ? newThumbnailUrl : a.thumbnailUrl, sensitiveType: creditsSensitiveType }
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
      const res = await fetch(`/api/worlds/${world.id}/favorite`, { method: "POST" });
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

  const TABS: { key: "profile" | "lore" | "inhabitants" | "gallery" | "map" | "timeline"; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
    { key: "lore", label: "Lore", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { key: "inhabitants", label: "Inhabitants", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><circle cx="17" cy="8" r="3"/><path d="M19 12.5A3.5 3.5 0 0 1 22 16v2"/></svg> },
    { key: "gallery", label: "Gallery", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { key: "map", label: "Map", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
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
            setArtworkCropSrc({ src: URL.createObjectURL(files[0]), file: files[0] });
            setPendingFiles(files);
          } else {
            setPendingFiles(files);
          }
          setPendingIsAvatar(false); setPendingCredits([{ type: "onsite", value: world.creator.username ?? "", label: "" }]);
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
      <input
        ref={mapFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMap(file);
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
              {/* Left column ─ thumbnail, worlds, sensitive content */}
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

                {/* Worlds in this image */}
                <div>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Worlds in this image
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {creditsWorlds.map((w) => (
                      <span key={w.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: "var(--novae-radius-sm)", background: "var(--novae-bg-tag)", border: "0.5px solid var(--novae-outline-tag)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-tag)" }}>
                        {w.name}
                        <button onClick={() => setCreditsWorlds((prev) => prev.filter((x) => x.id !== w.id))} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0 0 0 2px", lineHeight: 1, fontSize: 13 }}>×</button>
                      </span>
                    ))}
                  </div>
                  <div style={{ position: "relative", marginTop: 8 }}>
                    <input
                      value={creditsWorldSearch}
                      onChange={(e) => searchCreditsWorlds(e.target.value)}
                      placeholder="Search worlds to tag…"
                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                    />
                    {creditsWorldResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden" }}>
                        {creditsWorldResults.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => {
                              if (!creditsWorlds.find((x) => x.id === w.id)) setCreditsWorlds((prev) => [...prev, w]);
                              setCreditsWorldSearch(""); setCreditsWorldResults([]);
                            }}
                            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
                          >
                            {w.name}
                          </button>
                        ))}
                      </div>
                    )}
                    {creditsWorldLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--novae-text-secondary)" }}>…</span>}
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
                  meUsername={world.creator.username}
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
            setPendingCredits([{ type: "onsite", value: world.creator.username ?? "", label: "" }]);
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
              meUsername={world.creator.username}
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
                        await fetch(`/api/worlds/${world.id}`, {
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
              {[{ ...rootWorld, variantLabel: null as string | null }, ...auVariants].map((v) => {
                const isCurrent = v.id === world.id;
                const isBase = v.id === rootWorld.id;
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
                      onClick={() => !isCurrent && router.push(`/library/worlds/${v.id}`)}
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
                  onClick={() => { setAuName(`${rootWorld.name} (AU)`); setShowAuModal(true); }}
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
                  {t.auModalDescription.replace("{name}", rootWorld.name)}
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
            <MetaItem label="Owner" value={`@${world.creator.username}`} href={`/${world.creator.username}`} />
            {/* Designer — view mode */}
            {!editing && (() => {
              if (world.isDesigner) {
                return <MetaItem label="Designer" value={`@${world.creator.username}`} href={`/${world.creator.username}`} />;
              }
              if (!world.designerCredit) return null;
              if (world.designerCredit.startsWith("@")) {
                const u = world.designerCredit.slice(1);
                return <MetaItem label="Designer" value={`@${u}`} href={`/${u}`} />;
              }
              const m = world.designerCredit.match(/^\[(.+)\]\((.+)\)$/);
              if (m) return <MetaItem label="Designer" value={m[1]} href={m[2]} />;
              return <MetaItem label="Designer" value={world.designerCredit} />;
            })()}
            {/* Writer — view mode (not in character page? Actually character has isWriter too) */}
            {!editing && (() => {
              if (world.isWriter) {
                return <MetaItem label="Writer" value={`@${world.creator.username}`} href={`/${world.creator.username}`} />;
              }
              if (!world.writerCredit) return null;
              if (world.writerCredit.startsWith("@")) {
                const u = world.writerCredit.slice(1);
                return <MetaItem label="Writer" value={`@${u}`} href={`/${u}`} />;
              }
              const m = world.writerCredit.match(/^\[(.+)\]\((.+)\)$/);
              if (m) return <MetaItem label="Writer" value={m[1]} href={m[2]} />;
              return <MetaItem label="Writer" value={world.writerCredit} />;
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
                        onClick={() => setCreditValue(world.creator.username ?? "")}
                        style={{ alignSelf: "flex-start", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
                      >
                        Me (@{world.creator.username})
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
              value={new Intl.DateTimeFormat("en-GB").format(new Date(world.createdAt))}
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
              {/* Left sub-sidebar — no "Informations" and no "Voice Claim" panels */}
              <div className="char-body-side flex-col gap-6" style={{ display: "flex" }}>

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

                {/* Map — panel */}
                <SectionCard title="Map">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {maps.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", margin: 0 }}>
                        {isOwner ? "Add a map to visualize your world." : "No maps yet."}
                      </p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {maps.slice(0, 2).map((map) => (
                          <div key={map.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", backgroundColor: "var(--novae-bg-main)" }}>
                              {map.imageUrl && <img src={thumbUrl(map.imageUrl, 96) ?? map.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                            </div>
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", flex: 1 }}>{map.name}</span>
                            {isOwner && (
                              <button onClick={() => deleteMap(map.id)} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 14, padding: 2 }}>×</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {isOwner && maps.length > 2 && (
                      <button
                        onClick={() => setActiveTab("map")}
                        style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer", alignSelf: "flex-start", padding: 0 }}
                      >
                        View more
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => mapFileRef.current?.click()}
                        disabled={uploadingMap}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          padding: "8px 12px",
                          background: "var(--novae-btn-secondary)",
                          border: "1px dashed var(--novae-outline-all)",
                          borderRadius: "var(--novae-radius-sm)",
                          color: "var(--novae-text-btn)",
                          fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                          cursor: uploadingMap ? "not-allowed" : "pointer",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                        {uploadingMap ? "Uploading…" : "Upload map"}
                      </button>
                    )}

                    {/* Location pins — Coming soon */}
                    <div style={{ padding: "8px 12px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-main)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      Location pins : Coming soon
                    </div>
                  </div>
                </SectionCard>
              </div>

              {/* Main content area */}
              <div className="char-body-main gap-6">
                {(() => {
                  const defaultOrder = ["latestImages", "loreSummary", ...customContainers.map((c) => `custom:${c.id}`)];
                  const visibility: Record<string, boolean> = {
                    latestImages: true,
                    loreSummary: !!summary,
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

                    if (key === "loreSummary") {
                      return (
                        <SectionCard
                          title="Lore"
                          action={
                            <button onClick={() => setActiveTab("lore")} style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                              View more
                            </button>
                          }
                        >
                          <EditorRenderer content={summary} />
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

          {/* Tab: Lore (was Story) */}
          {activeTab === "lore" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Summary box */}
              <SectionCard title="Summary">
                {isOwner && editing ? (
                  <EditorField
                    value={summary}
                    onChange={setSummary}
                    placeholder="A short summary of the world…"
                  />
                ) : summary ? (
                  <EditorRenderer content={summary} />
                ) : (
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                    {isOwner ? "Add a summary to describe this world." : "No summary yet."}
                  </p>
                )}
              </SectionCard>

              {/* Full lore */}
              <SectionCard title="Lore">
                {isOwner && editing ? (
                  <EditorField
                    value={biography}
                    onChange={setBiography}
                    placeholder="Write the world's full lore…"
                  />
                ) : biography ? (
                  <EditorRenderer content={biography} />
                ) : (
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                    {isOwner ? "Click Edit to write the full lore." : "No lore written yet."}
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
                  Edit lore
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

          {/* Tab: Inhabitants (was Relationships) — characters belonging to the world */}
          {activeTab === "inhabitants" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isOwner && (
                <button
                  onClick={() => setShowAddInhabitant(true)}
                  style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "10px 20px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: "pointer" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add character
                </button>
              )}
              {inhabitants.length === 0 ? (
                <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}>No characters yet.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                  {inhabitants.map((character) => {
                    const imgSrc = character.avatarUrl ?? null;
                    const charHref = `/library/characters/${character.numId}-${character.slug}`;
                    return (
                    <div key={character.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 12, position: "relative" }}>
                      <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", backgroundColor: "var(--novae-bg-main)" }}>
                        {imgSrc ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumbUrl(imgSrc, 128) ?? imgSrc} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : null}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a href={charHref} style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", textDecoration: "none", display: "block" }}>{character.name}</a>
                        {character.user?.username && (
                          <span style={{ display: "block", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>by @{character.user.username}</span>
                        )}
                      </div>
                      {isOwner && (
                        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                          <button onClick={() => removeInhabitant(character.id)} style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 14, padding: "2px 5px" }}>×</button>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

              {/* Add Character Modal */}
              {showAddInhabitant && (
                <div style={{ position: "fixed", inset: 0, background: "transparent", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddInhabitant(false); }}>
                  <div style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 24, width: 420, maxWidth: "90vw", display: "flex", flexDirection: "column", gap: 16 }}>
                    <h3 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>Add Character to World</h3>

                    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        value={inhabitantSearch}
                        onChange={(e) => { setInhabitantSearch(e.target.value); searchInhabitants(e.target.value); }}
                        placeholder="Search characters to add…"
                        style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                      />
                      {inhabitantSearchLoading && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--novae-text-secondary)", fontSize: 12 }}>…</span>}
                      {inhabitantResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", zIndex: 10, maxHeight: 240, overflowY: "auto" }}>
                          {inhabitantResults.map((c) => (
                            <button key={c.id} onClick={() => { addInhabitant(c.id); setInhabitantSearch(""); setInhabitantResults([]); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", flexShrink: 0, background: "var(--novae-bg-main)" }}>
                                {c.avatarUrl && <img src={thumbUrl(c.avatarUrl, 56) ?? c.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                              </div>
                              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)" }}>{c.name}</span>
                              {c.user?.username && <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>@{c.user.username}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {!inhabitantSearchLoading && inhabitantSearch.trim() && inhabitantResults.length === 0 && (
                        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", marginTop: 4, display: "block" }}>No characters found.</span>
                      )}
                      {inhabitantSaving && <span style={{ fontSize: 12, color: "var(--novae-text-secondary)" }}>Adding…</span>}
                    </div>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button onClick={() => setShowAddInhabitant(false)} style={{ padding: "8px 16px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Map */}
          {activeTab === "map" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {isOwner && (
                <button
                  onClick={() => mapFileRef.current?.click()}
                  disabled={uploadingMap}
                  style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start", padding: "10px 20px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: uploadingMap ? "not-allowed" : "pointer", opacity: uploadingMap ? 0.7 : 1 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                  {uploadingMap ? "Uploading…" : "Upload map"}
                </button>
              )}
              {maps.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "48px 0" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                  <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)" }}>
                    {isOwner ? "Upload a map to get started." : "No maps yet."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                  {maps.map((map) => (
                    <div key={map.id} style={{ backgroundColor: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden", position: "relative" }}>
                      <div style={{ aspectRatio: "4/3", backgroundColor: "var(--novae-bg-main)", position: "relative" }}>
                        {map.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={map.imageUrl} alt={map.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{map.name}</span>
                        {isOwner && (
                          <button onClick={() => deleteMap(map.id)} title="Delete map" style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Location pins — Coming soon */}
              <div style={{ padding: "12px 16px", borderRadius: "var(--novae-radius-md)", border: "1px solid var(--novae-outline-all)", background: "var(--novae-bg-card)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Location pins : Coming soon
              </div>
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
                const res = await fetch(`/api/worlds/${world.id}/galleries/${galleryId}`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ artworkId }),
                });
                if (res.ok) setGalleries((prev) => prev.map((gal) =>
                  gal.id === galleryId ? { ...gal, images: [...gal.images, { id: Math.random().toString(), artworkId, order: 0 }] } : gal
                ));
              };

              const uncategorized = artworks.filter((a) => !galleries.some((g) => g.images.some((i) => i.artworkId === a.id)));

              const tileProps = { isOwner, galleries, worldId: world.id, assigningArtwork, setAssigningArtwork, setLightbox, openEditCredits, deleteArtwork, setGalleries, isDndActive: galleries.length > 0, selectMode, onToggleSelect: toggleSelectArtwork };

              const reorderGalleries = (activeId: string, overId: string) => {
                const oldIdx = galleries.findIndex((g) => g.id === activeId);
                const newIdx = galleries.findIndex((g) => g.id === overId);
                if (oldIdx === -1 || newIdx === -1) return;
                const reordered = arrayMove(galleries, oldIdx, newIdx);
                setGalleries(reordered);
                fetch(`/api/worlds/${world.id}/galleries/reorder`, {
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
                        const res = await fetch(`/api/worlds/${world.id}/galleries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newGalleryName.trim() }) });
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
                                const res = await fetch(`/api/worlds/${world.id}/galleries/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: renamingGallery.name.trim() }) });
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
                                const res = await fetch(`/api/worlds/${world.id}/galleries/${g.id}`, { method: "DELETE" });
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
                { count: inhabitants.length, label: "inhabitants" },
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
                    href={`/browse/worlds?tag=${encodeURIComponent(tag.name)}`}
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

          {/* Inhabitants */}
          <SectionCard
            title="Inhabitants"
            action={
              <button onClick={() => setActiveTab("inhabitants")} style={{ background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
                View more
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {inhabitants.slice(0, 3).map((character) => (
                <div key={character.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <a href={`/library/characters/${character.numId}-${character.slug}`} style={{ width: 48, height: 48, flexShrink: 0, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", backgroundColor: "var(--novae-bg-main)", display: "block" }}>
                    {character.avatarUrl && <img src={thumbUrl(character.avatarUrl, 128) ?? character.avatarUrl} alt="" loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={`/library/characters/${character.numId}-${character.slug}`} style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-primary)", textDecoration: "none", display: "block" }}>{character.name}</a>
                    {character.user?.username && (
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>by @{character.user.username}</span>
                    )}
                  </div>
                </div>
              ))}
              {inhabitants.length === 0 && (
                <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>No characters yet.</p>
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