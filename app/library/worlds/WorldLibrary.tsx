"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type World = {
  id: string;
  numId: number;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  locations: { id: string; name: string }[];
  characters: { id: string; name: string; numId: number }[];
};

type Folder = { id: string; name: string; isPublic: boolean };

// ── World card ───────────────────────────────────────────────────────────

function WorldCard({
  world,
  selected,
  selectMode,
  onSelect,
  onDelete,
  dragHandleProps,
}: {
  world: World;
  selected?: boolean;
  selectMode?: boolean;
  onSelect?: () => void;
  onDelete: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}) {
  const cover = world.coverImageUrl ?? null;

  return (
    <div
      style={{ position: "relative", cursor: selectMode ? "pointer" : undefined }}
      onClick={selectMode ? (e) => { e.preventDefault(); onSelect?.(); } : undefined}
    >
      <Link href={`/library/worlds/${world.numId}-${world.slug}`} style={{ textDecoration: "none", pointerEvents: selectMode ? "none" : undefined }}>
        <div
          className="world-card"
          style={{ outline: selected ? "2px solid var(--novae-text-link)" : undefined, outlineOffset: 2 }}
        >
          <div style={{ width: "100%", aspectRatio: "1", backgroundColor: "var(--novae-bg-main)", position: "relative" }}>
            {dragHandleProps && !selectMode && (
              <div {...dragHandleProps} style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "grab" }} />
            )}
            {cover ? (
              <Image src={cover} alt={world.name} fill sizes="220px" className="object-cover" />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity={0.3}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
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
              {world.name}
            </p>
            <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              <span>{world.locations.length} locations</span>
              <span>·</span>
              <span>{world.characters.length} characters</span>
            </div>
          </div>
        </div>
      </Link>
      {!selectMode && (
        <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
          <button
            onClick={(e) => { e.preventDefault(); onDelete(world.id); }}
            title="Delete world"
            style={{ width: 28, height: 28, borderRadius: "var(--novae-radius-sm)", background: "rgba(12,15,22,0.75)", border: "1px solid var(--novae-outline-all)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--novae-text-secondary)", backdropFilter: "blur(4px)" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function DraggableWorldCard(props: React.ComponentProps<typeof WorldCard>) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: props.world.id, data: { type: "world" } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1, touchAction: "none" }}>
      <WorldCard {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

// ── Selection bar ────────────────────────────────────────────────────────────

function SelectionBar({
  count, onMoveSelected, onCancel, btnStyle,
}: {
  count: number;
  onMoveSelected: (folderId: string | null) => void;
  onCancel: () => void;
  btnStyle: React.CSSProperties;
}) {
  return (
    <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 100, display: "flex", alignItems: "center", gap: 10, background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}>
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)", whiteSpace: "nowrap" }}>
        {count} selected
      </span>
      <div style={{ width: 1, height: 16, background: "var(--novae-outline-all)" }} />
      <button onClick={onCancel} style={{ ...btnStyle }}>Cancel</button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function WorldLibrary({ worlds }: { worlds: World[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [localWorlds, setLocalWorlds] = useState(worlds);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleteConfirmPending, setDeleteConfirmPending] = useState(false);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"world" | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // ── Handlers ──

  async function handleDelete() {
    if (!confirmId) return;
    setDeleteConfirmPending(true);
    const res = await fetch(`/api/worlds/${confirmId}`, { method: "DELETE" });
    if (res.ok) {
      setLocalWorlds((ws) => ws.filter((w) => w.id !== confirmId));
      setConfirmId(null);
      startTransition(() => router.refresh());
    }
    setDeleteConfirmPending(false);
  }

  function toggleSelect(worldId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(worldId)) next.delete(worldId); else next.add(worldId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelected(new Set());
    setSelectMode(false);
  }

  async function persistWorldOrder(orderedWorlds: World[]) {
    await fetch("/api/worlds/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: orderedWorlds.map((w, i) => ({ id: w.id, order: i })) }),
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
    if (type === "world") {
      const oldIdx = localWorlds.findIndex((w) => w.id === activeIdStr);
      const newIdx = localWorlds.findIndex((w) => w.id === overIdStr);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(localWorlds, oldIdx, newIdx);
        setLocalWorlds(reordered);
        persistWorldOrder(reordered);
      }
    }
  }

  // ── Derived ──

  const confirmWorld = localWorlds.find((w) => w.id === confirmId);
  const activeWorld = activeType === "world" ? localWorlds.find((w) => w.id === activeId) : undefined;

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
      {confirmWorld && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmId(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: 32, width: "min(360px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <p style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)", margin: "0 0 8px" }}>Delete world?</p>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: "var(--novae-text-primary)" }}>{confirmWorld.name}</strong> and all its locations and characters will be permanently deleted.
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
          onMoveSelected={exitSelectMode}
          onCancel={exitSelectMode}
          btnStyle={btnStyle}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
          Worlds
        </span>
        {localWorlds.length > 0 && (
          <button
            onClick={() => { setSelectMode((v) => !v); if (selectMode) setSelected(new Set()); }}
            style={{ ...btnStyle, marginLeft: "auto", color: selectMode ? "var(--novae-text-link)" : "var(--novae-text-secondary)", borderColor: selectMode ? "var(--novae-text-link)" : "var(--novae-outline-all)" }}
          >
            {selectMode ? "Cancel selection" : "Select"}
          </button>
        )}
      </div>

      {/* Empty state */}
      {localWorlds.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "80px 0", color: "var(--novae-text-secondary)" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity={0.4}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p style={{ margin: 0, fontSize: "var(--novae-text-lg)" }}>No worlds yet.</p>
          <Link href="/library/new/world" style={{ color: "var(--novae-btn-primary)", fontSize: "var(--novae-text-sm)", textDecoration: "none", fontWeight: 600 }}>
            Create your first world →
          </Link>
        </div>
      ) : (
        /* ── World grid ── */
        <DndContext
          sensors={sensors}
          onDragStart={(e) => { setActiveId(e.active.id as string); setActiveType(e.active.data.current?.type ?? null); }}
          onDragOver={(e) => setOverId(e.over?.id as string ?? null)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => { setActiveId(null); setActiveType(null); setOverId(null); }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {localWorlds.map((world) =>
              selectMode ? (
                <WorldCard
                  key={world.id}
                  world={world}
                  selected={selected.has(world.id)}
                  selectMode
                  onSelect={() => toggleSelect(world.id)}
                  onDelete={setConfirmId}
                />
              ) : (
                <DraggableWorldCard
                  key={world.id}
                  world={world}
                  onDelete={setConfirmId}
                />
              )
            )}
          </div>

          <DragOverlay>
            {activeType === "world" && activeWorld && (
              <div style={{ width: 220, opacity: 0.9, transform: "rotate(2deg)", pointerEvents: "none" }}>
                <WorldCard world={activeWorld} onDelete={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}