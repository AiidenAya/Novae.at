"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Char = {
  id: string;
  numId: number;
  slug: string;
  name: string;
  avatarUrl: string | null;
  folderId: string | null;
  artworks: { imageUrl: string }[];
  tags: { tag: { id: string; name: string } }[];
  favorites: unknown[];
};

type Folder = { id: string; name: string; isPublic: boolean };

// ── Character card ───────────────────────────────────────────────────────────

function CharCard({
  char,
  selected,
  selectMode,
  onSelect,
  onDelete,
  dragHandleProps,
}: {
  char: Char;
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: () => void;
  onDelete: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const cover = char.avatarUrl ?? char.artworks[0]?.imageUrl ?? null;

  return (
    <div
      style={{ position: "relative", cursor: selectMode ? "pointer" : undefined }}
      onClick={selectMode ? (e) => { e.preventDefault(); onSelect?.(); } : undefined}
    >
      <Link href={`/library/characters/${char.numId}-${char.slug}`} style={{ textDecoration: "none", pointerEvents: selectMode ? "none" : undefined }}>
        <div
          className="character-card"
          style={{ outline: selected ? "2px solid var(--novae-text-link)" : undefined, outlineOffset: 2 }}
        >
          <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--novae-bg-main)", position: "relative" }}>
            {dragHandleProps && !selectMode && (
              <div {...dragHandleProps} style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "grab" }} />
            )}
            {cover ? (
              <Image src={cover} alt={char.name} fill sizes="220px" className="object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.3}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
            {selectMode && (
              <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  background: selected ? "var(--novae-btn-primary)" : "rgba(12,15,22,0.75)",
                  border: `2px solid ${selected ? "var(--novae-btn-primary)" : "rgba(255,255,255,0.4)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(4px)",
                }}>
                  {selected && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {char.name}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {char.tags.map(({ tag }) => (
                <span key={tag.id} style={{ padding: "2px 8px", borderRadius: "var(--novae-radius-sm)", border: "0.5px solid var(--novae-outline-tag)", background: "var(--novae-bg-tag)", fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-tag)" }}>
                  #{tag.name}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{char.favorites.length} ♥</span>
            </div>
          </div>
        </div>
      </Link>
      {!selectMode && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(char.id); }}
            title="Delete character"
            style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function DraggableCharCard(props: React.ComponentProps<typeof CharCard>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: props.char.id, data: { type: "character" } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, touchAction: "none" }}>
      <CharCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

// ── Folder card (sortable + droppable for chars) ────────────────────────────

function SortableFolderCard({
  folder, chars, isCharOver, onOpen, onToggleVisibility, onDelete,
}: {
  folder: Folder;
  chars: Char[];
  isCharOver: boolean;
  onOpen: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `folder-${folder.id}`,
    data: { type: "folder" },
  });
  const cover = chars[0]?.avatarUrl ?? chars[0]?.artworks[0]?.imageUrl ?? null;
  const [hover, setHover] = useState(false);

  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", cursor: "pointer", transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1, touchAction: "none" }}
      {...attributes}
      {...listeners}
    >
      <div className="character-card" style={{ outline: isCharOver ? "2px solid var(--novae-text-link)" : undefined, outlineOffset: 2, transition: "outline 0.1s" }}>
        <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--novae-bg-main)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {cover && (
            <Image src={cover} alt={folder.name} fill sizes="220px" className="object-cover" style={{ opacity: 0.4 }} />
          )}
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--novae-text-link)", position: "relative", zIndex: 1, opacity: 0.9 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "2px 8px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)", zIndex: 2 }}>
            {chars.length}
          </span>
          {!folder.isPublic && (
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(220,150,0,0.15)", border: "1px solid rgba(220,150,0,0.4)", borderRadius: "var(--novae-radius-sm)", padding: "2px 7px", zIndex: 2 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#e0a030" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "10px", color: "#e0a030" }}>Hidden</span>
            </div>
          )}
          {isCharOver && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(105,61,169,0.25)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, borderRadius: "inherit" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-link)", fontWeight: 600 }}>Drop here</span>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 14px" }}>
          <p style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {folder.name}
          </p>
        </div>
      </div>

      {hover && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, zIndex: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            title={folder.isPublic ? "Hide from public" : "Make public"}
            style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: folder.isPublic ? "rgba(12,15,22,0.75)" : "rgba(220,150,0,0.2)", border: `1px solid ${folder.isPublic ? "var(--novae-outline-all)" : "rgba(220,150,0,0.4)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: folder.isPublic ? "var(--novae-text-secondary)" : "#e0a030", backdropFilter: "blur(4px)" }}
          >
            {folder.isPublic
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            }
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete folder"
            style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Selection bar ────────────────────────────────────────────────────────────

function SelectionBar({
  count, inFolder, folders, onMoveSelected, onCancel, btnStyle,
}: {
  count: number;
  inFolder: boolean;
  folders: Folder[];
  onMoveSelected: (folderId: string | null) => void;
  onCancel: () => void;
  btnStyle: React.CSSProperties;
}) {
  const [targetId, setTargetId] = useState<string>("");

  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 10, background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)", whiteSpace: "nowrap" }}>
        {count} selected
      </span>
      <div style={{ width: 1, height: 16, background: "var(--novae-outline-all)" }} />
      {inFolder && (
        <button onClick={() => onMoveSelected(null)} style={{ ...btnStyle, color: "var(--novae-text-primary)" }}>
          Remove from folder
        </button>
      )}
      {folders.length > 0 && (
        <>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            style={{ background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "6px 10px", color: targetId ? "var(--novae-text-primary)" : "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", outline: "none", cursor: "pointer" }}
          >
            <option value="">Move to folder…</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button
            onClick={() => { if (targetId) { onMoveSelected(targetId); setTargetId(""); } }}
            disabled={!targetId}
            style={{ ...btnStyle, background: targetId ? "var(--novae-btn-primary)" : undefined, color: targetId ? "#fff" : "var(--novae-text-secondary)", borderColor: targetId ? "transparent" : "var(--novae-outline-all)", opacity: targetId ? 1 : 0.5, cursor: targetId ? "pointer" : "not-allowed" }}
          >
            Move
          </button>
        </>
      )}
      <div style={{ width: 1, height: 16, background: "var(--novae-outline-all)" }} />
      <button onClick={onCancel} style={{ ...btnStyle }}>Cancel</button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function CharacterLibrary({ characters, folders: initialFolders }: { characters: Char[]; folders: Folder[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localChars, setLocalChars] = useState(characters);
  const [folders, setFolders] = useState(initialFolders);

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteConfirmPending, setDeleteConfirmPending] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderPending, setFolderPending] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"character" | "folder" | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // ── Handlers ──

  async function handleDelete() {
    if (!confirmId) return;
    setDeleteConfirmPending(true);
    const res = await fetch(`/api/characters/${confirmId}`, { method: "DELETE" });
    if (res.ok) {
      setLocalChars((cs) => cs.filter((c) => c.id !== confirmId));
      setConfirmId(null);
      startTransition(() => router.refresh());
    }
    setDeleteConfirmPending(false);
  }

  async function handleMove(charId: string, folderId: string | null) {
    if (folderId) {
      await fetch(`/api/character-folders/${folderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: charId }),
      });
    } else {
      const char = localChars.find((c) => c.id === charId);
      if (char?.folderId) {
        await fetch(`/api/character-folders/${char.folderId}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId: charId, remove: true }),
        });
      }
    }
    setLocalChars((cs) => cs.map((c) => c.id === charId ? { ...c, folderId } : c));
  }

  async function handleMoveSelected(folderId: string | null) {
    await Promise.all([...selected].map((id) => handleMove(id, folderId)));
    setSelected(new Set());
    setSelectMode(false);
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    setFolderPending(true);
    const res = await fetch("/api/character-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName.trim() }),
    });
    if (res.ok) {
      const f = await res.json();
      setFolders((prev) => [...prev, { id: f.id, name: f.name, isPublic: true }]);
      setFolderName("");
      setCreatingFolder(false);
    }
    setFolderPending(false);
  }

  async function handleDeleteFolder(folderId: string) {
    await fetch("/api/character-folders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: folderId }),
    });
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setLocalChars((cs) => cs.map((c) => c.folderId === folderId ? { ...c, folderId: null } : c));
    if (openFolderId === folderId) setOpenFolderId(null);
  }

  async function handleToggleFolderVisibility(folderId: string) {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const next = !folder.isPublic;
    setFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, isPublic: next } : f));
    await fetch("/api/character-folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: folderId, isPublic: next }),
    });
  }

  async function persistFolderOrder(orderedFolders: Folder[]) {
    await fetch("/api/character-folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: orderedFolders.map((f, i) => ({ id: f.id, order: i })) }),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    setOverId(null);
    if (!over) return;
    const type = active.data.current?.type as string;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;
    if (type === "folder") {
      const oldIdx = folders.findIndex((f) => `folder-${f.id}` === activeIdStr);
      const newIdx = folders.findIndex((f) => `folder-${f.id}` === overIdStr);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(folders, oldIdx, newIdx);
        setFolders(reordered);
        persistFolderOrder(reordered);
      }
    } else if (type === "character" && overIdStr.startsWith("folder-")) {
      handleMove(activeIdStr, overIdStr.replace("folder-", ""));
    }
  }

  function toggleSelect(charId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(charId)) next.delete(charId); else next.add(charId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelected(new Set());
    setSelectMode(false);
  }

  // ── Derived ──

  const openFolder = openFolderId ? folders.find((f) => f.id === openFolderId) : null;
  const viewChars = openFolderId
    ? localChars.filter((c) => c.folderId === openFolderId)
    : localChars.filter((c) => !c.folderId);
  const confirmChar = localChars.find((c) => c.id === confirmId);
  const activeChar = activeType === "character" ? localChars.find((c) => c.id === activeId) : undefined;
  const activeFolder = activeType === "folder" ? folders.find((f) => `folder-${f.id}` === activeId) : undefined;
  const otherFolders = folders.filter((f) => f.id !== openFolderId);

  const btnStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 14px",
    background: "var(--novae-bg-card)",
    border: "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    color: "var(--novae-text-secondary)",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)",
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <>
      {/* Delete confirm modal */}
      {confirmChar && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmId(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: "min(360px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: "0 0 8px" }}>Delete character?</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: "var(--novae-text-primary)" }}>{confirmChar.name}</strong> and all their artwork will be permanently deleted.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmId(null)} disabled={deleteConfirmPending} style={{ background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirmPending} style={{ background: "#c0392b", border: "none", borderRadius: "var(--novae-radius-md)", padding: "10px 20px", cursor: deleteConfirmPending ? "not-allowed" : "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "#fff", opacity: deleteConfirmPending ? 0.6 : 1 }}>
                {deleteConfirmPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating selection bar */}
      {selectMode && selected.size > 0 && (
        <SelectionBar
          count={selected.size}
          inFolder={!!openFolderId}
          folders={otherFolders}
          onMoveSelected={handleMoveSelected}
          onCancel={exitSelectMode}
          btnStyle={btnStyle}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        {openFolderId ? (
          <>
            <button
              onClick={() => { setOpenFolderId(null); exitSelectMode(); }}
              style={{ ...btnStyle }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back
            </button>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              {openFolder?.name}
            </span>
            {openFolder && (
              <button
                onClick={() => handleToggleFolderVisibility(openFolderId)}
                style={{ ...btnStyle, color: openFolder.isPublic ? "var(--novae-text-secondary)" : "#e0a030", borderColor: openFolder.isPublic ? "var(--novae-outline-all)" : "rgba(220,150,0,0.4)", background: openFolder.isPublic ? "var(--novae-bg-card)" : "rgba(220,150,0,0.08)" }}
              >
                {openFolder.isPublic
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                }
                {openFolder.isPublic ? "Public" : "Hidden"}
              </button>
            )}
            {viewChars.length > 0 && (
              <button
                onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelected(new Set()); }}
                style={{ ...btnStyle, marginLeft: "auto", color: selectMode ? "var(--novae-text-link)" : "var(--novae-text-secondary)", borderColor: selectMode ? "var(--novae-text-link)" : "var(--novae-outline-all)" }}
              >
                {selectMode ? "Cancel selection" : "Select"}
              </button>
            )}
            <button
              onClick={() => handleDeleteFolder(openFolderId)}
              style={{ ...btnStyle, marginLeft: viewChars.length > 0 ? 0 : "auto" }}
              title="Delete folder"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              Delete folder
            </button>
          </>
        ) : (
          <>
            {creatingFolder ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  autoFocus
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setCreatingFolder(false); }}
                  placeholder="Folder name"
                  style={{ background: "var(--novae-bg-input)", border: "1px solid var(--novae-outline-selected)", borderRadius: "var(--novae-radius-md)", padding: "8px 14px", color: "var(--novae-text-primary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", outline: "none" }}
                />
                <button onClick={handleCreateFolder} disabled={folderPending || !folderName.trim()} style={{ padding: "8px 16px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer", opacity: (!folderName.trim() || folderPending) ? 0.5 : 1 }}>
                  Create
                </button>
                <button onClick={() => setCreatingFolder(false)} style={btnStyle}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setCreatingFolder(true)} style={btnStyle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                New folder
              </button>
            )}
            {localChars.length > 0 && (
              <button
                onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelected(new Set()); }}
                style={{ ...btnStyle, marginLeft: "auto", color: selectMode ? "var(--novae-text-link)" : "var(--novae-text-secondary)", borderColor: selectMode ? "var(--novae-text-link)" : "var(--novae-outline-all)" }}
              >
                {selectMode ? "Cancel selection" : "Select"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Empty state */}
      {localChars.length === 0 && folders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 0", color: "var(--novae-text-secondary)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.4}>
            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          <p style={{ margin: 0, fontSize: "var(--novae-text-lg)" }}>No characters yet.</p>
          <Link href="/library/new/character" style={{ color: "var(--novae-btn-primary)", fontSize: "var(--novae-text-sm)", textDecoration: "none", fontWeight: 600 }}>
            Create your first character →
          </Link>
        </div>
      ) : openFolderId ? (
        /* ── Folder view ── */
        viewChars.length === 0 ? (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
            This folder is empty.
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {viewChars.map((char) => (
              <CharCard
                key={char.id}
                char={char}
                selected={selected.has(char.id)}
                selectMode={selectMode}
                onSelect={() => toggleSelect(char.id)}
                onDelete={setConfirmId}
              />
            ))}
          </div>
        )
      ) : (
        /* ── Top-level grid: folder cards + ungrouped chars ── */
        <DndContext
          sensors={sensors}
          onDragStart={(e) => { setActiveId(e.active.id as string); setActiveType(e.active.data.current?.type ?? null); }}
          onDragOver={(e) => setOverId(e.over?.id as string ?? null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setActiveType(null); setOverId(null); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {folders.length > 0 && (
              <SortableContext items={folders.map((f) => `folder-${f.id}`)} strategy={rectSortingStrategy}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
                  {folders.map((folder) => (
                    <SortableFolderCard
                      key={folder.id}
                      folder={folder}
                      chars={localChars.filter((c) => c.folderId === folder.id)}
                      isCharOver={activeType === "character" && overId === `folder-${folder.id}`}
                      onOpen={() => setOpenFolderId(folder.id)}
                      onToggleVisibility={() => handleToggleFolderVisibility(folder.id)}
                      onDelete={() => handleDeleteFolder(folder.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
            {folders.length > 0 && viewChars.length > 0 && (
              <hr style={{ border: "none", borderTop: "1px solid var(--novae-outline-all)", margin: 0 }} />
            )}
            {viewChars.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
                {viewChars.map((char) =>
                  selectMode ? (
                    <CharCard
                      key={char.id}
                      char={char}
                      selected={selected.has(char.id)}
                      selectMode
                      onSelect={() => toggleSelect(char.id)}
                      onDelete={setConfirmId}
                    />
                  ) : (
                    <DraggableCharCard
                      key={char.id}
                      char={char}
                      onDelete={setConfirmId}
                    />
                  )
                )}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeType === "character" && activeChar && (
              <div style={{ width: 220, opacity: 0.9, transform: "rotate(2deg)", pointerEvents: "none" }}>
                <CharCard char={activeChar} onDelete={() => {}} />
              </div>
            )}
            {activeType === "folder" && activeFolder && (
              <div style={{ width: 220, opacity: 0.85, transform: "rotate(1.5deg)", pointerEvents: "none" }}>
                <SortableFolderCard
                  folder={activeFolder}
                  chars={localChars.filter((c) => c.folderId === activeFolder.id)}
                  isCharOver={false}
                  onOpen={() => {}}
                  onToggleVisibility={() => {}}
                  onDelete={() => {}}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
