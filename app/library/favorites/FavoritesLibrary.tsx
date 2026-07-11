"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type Fav = {
  id: string;
  numId: number;
  slug: string;
  name: string;
  avatarUrl: string | null;
  cover: string | null;
  username: string | null;
  folderId: string | null;
};

type Folder = { id: string; name: string };

function FavCard({
  fav,
  folders,
  onUnfavorite,
  onMove,
  dragHandleProps,
}: {
  fav: Fav;
  folders: Folder[];
  onUnfavorite: (id: string) => void;
  onMove: (charId: string, folderId: string | null) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <Link href={`/library/characters/${fav.numId}-${fav.slug}`} style={{ textDecoration: "none" }}>
        <div className="character-card">
          <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--novae-bg-main)", position: "relative" }}>
            {dragHandleProps && (
              <div {...dragHandleProps} style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "grab" }} />
            )}
            {fav.cover ? (
              <Image src={fav.cover} alt={fav.name} fill sizes="220px" className="object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.3}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px" }}>
            <p style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {fav.name}
            </p>
            {fav.username && (
              <p style={{ margin: "4px 0 0", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                by @{fav.username}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, zIndex: 10 }}>
        {folders.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={(e) => { e.preventDefault(); setShowMenu((v) => !v); }}
              title="Move to folder"
              style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            {showMenu && (
              <div
                style={{ position: "absolute", top: 32, right: 0, zIndex: 50, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden", minWidth: 160, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                onMouseLeave={() => setShowMenu(false)}
              >
                {fav.folderId && (
                  <button
                    onClick={(e) => { e.preventDefault(); onMove(fav.id, null); setShowMenu(false); }}
                    style={{ width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}
                  >
                    Remove from folder
                  </button>
                )}
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={(e) => { e.preventDefault(); onMove(fav.id, f.id); setShowMenu(false); }}
                    style={{ width: "100%", textAlign: "left", padding: "9px 14px", background: fav.folderId === f.id ? "rgba(105,61,169,0.1)" : "none", border: "none", cursor: "pointer", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: fav.folderId === f.id ? "var(--novae-text-link)" : "var(--novae-text-primary)" }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onUnfavorite(fav.id); }}
          title="Remove from favorites"
          style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e05252", backdropFilter: "blur(4px)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
    </div>
  );
}

function DraggableFavCard(props: Parameters<typeof FavCard>[0]) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: props.fav.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, touchAction: "none" };
  return (
    <div ref={setNodeRef} style={style}>
      <FavCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function DroppableZone({ id, isOver, children }: { id: string; isOver: boolean; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ borderRadius: "var(--novae-radius-md)", border: `2px dashed ${isOver ? "var(--novae-text-link)" : "transparent"}`, transition: "border-color 0.15s", padding: isOver ? 8 : 0 }}>
      {children}
    </div>
  );
}

function FavGrid({ favs, folders, onUnfavorite, onMove }: { favs: Fav[]; folders: Folder[]; onUnfavorite: (id: string) => void; onMove: (charId: string, folderId: string | null) => void }) {
  if (favs.length === 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
      {favs.map((fav) => <DraggableFavCard key={fav.id} fav={fav} folders={folders} onUnfavorite={onUnfavorite} onMove={onMove} />)}
    </div>
  );
}

export default function FavoritesLibrary({ favorites, folders: initialFolders }: { favorites: Fav[]; folders: Folder[] }) {
  const [favs, setFavs] = useState(favorites);
  const [folders, setFolders] = useState(initialFolders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderPending, setFolderPending] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleUnfavorite(charId: string) {
    setFavs((cs) => cs.filter((c) => c.id !== charId));
    await fetch(`/api/characters/${charId}/favorite`, { method: "POST" });
  }

  async function handleMove(charId: string, folderId: string | null) {
    const fav = favs.find((c) => c.id === charId);
    if (folderId) {
      await fetch(`/api/favorite-folders/${folderId}/assign`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: charId }),
      });
    } else if (fav?.folderId) {
      await fetch(`/api/favorite-folders/${fav.folderId}/assign`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: charId, remove: true }),
      });
    }
    setFavs((cs) => cs.map((c) => c.id === charId ? { ...c, folderId } : c));
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    setFolderPending(true);
    const res = await fetch("/api/favorite-folders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: folderName.trim() }),
    });
    if (res.ok) {
      const f = await res.json();
      setFolders((prev) => [...prev, { id: f.id, name: f.name }]);
      setFolderName("");
      setCreatingFolder(false);
    }
    setFolderPending(false);
  }

  async function handleDeleteFolder(folderId: string) {
    await fetch("/api/favorite-folders", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: folderId }),
    });
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFavs((cs) => cs.map((c) => c.folderId === folderId ? { ...c, folderId: null } : c));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over) return;
    const charId = active.id as string;
    const dropId = over.id as string;
    if (dropId === "ungrouped") handleMove(charId, null);
    else if (dropId.startsWith("folder-")) handleMove(charId, dropId.replace("folder-", ""));
  }

  const ungrouped = favs.filter((c) => !c.folderId);
  const activeFav = favs.find((c) => c.id === activeId);
  const hasFolders = folders.length > 0;

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
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
            <button onClick={() => setCreatingFolder(false)} style={{ padding: "8px 12px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            New folder
          </button>
        )}
      </div>

      {favs.length === 0 && folders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 0", color: "var(--novae-text-secondary)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.4}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <p style={{ margin: 0, fontSize: "var(--novae-text-lg)" }}>No favorites yet.</p>
          <Link href="/browse/characters" style={{ color: "var(--novae-btn-primary)", fontSize: "var(--novae-text-sm)", textDecoration: "none", fontWeight: 600 }}>
            Discover characters →
          </Link>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragOver={(e) => setOverId(e.over?.id as string ?? null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setOverId(null); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {folders.map((folder) => {
              const folderFavs = favs.filter((c) => c.folderId === folder.id);
              const isCollapsed = collapsed[folder.id];
              const isOver = overId === `folder-${folder.id}`;
              return (
                <DroppableZone key={folder.id} id={`folder-${folder.id}`} isOver={isOver}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <button
                      onClick={() => setCollapsed((s) => ({ ...s, [folder.id]: !s[folder.id] }))}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--novae-text-secondary)" }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--novae-text-link)" }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{folder.name}</span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{folderFavs.length}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      title="Delete folder"
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 4, display: "flex", alignItems: "center", opacity: 0.5 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                  {!isCollapsed && (
                    folderFavs.length === 0 ? (
                      <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: isOver ? "var(--novae-text-link)" : "var(--novae-text-secondary)", margin: 0, paddingLeft: 4 }}>
                        {isOver ? "Drop here to add to this folder" : "Empty — drag a favorite here or use the folder icon on each card."}
                      </p>
                    ) : (
                      <FavGrid favs={folderFavs} folders={folders} onUnfavorite={handleUnfavorite} onMove={handleMove} />
                    )
                  )}
                </DroppableZone>
              );
            })}

            {(ungrouped.length > 0 || (hasFolders && activeId)) && (
              <DroppableZone id="ungrouped" isOver={overId === "ungrouped"}>
                {hasFolders && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-secondary)" }}>Ungrouped</span>
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{ungrouped.length}</span>
                  </div>
                )}
                <FavGrid favs={ungrouped} folders={folders} onUnfavorite={handleUnfavorite} onMove={handleMove} />
              </DroppableZone>
            )}
          </div>

          <DragOverlay>
            {activeFav && (
              <div style={{ width: 220, opacity: 0.9, transform: "rotate(2deg)", pointerEvents: "none" }}>
                <FavCard fav={activeFav} folders={[]} onUnfavorite={() => {}} onMove={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
