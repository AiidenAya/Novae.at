"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, SectionTitle, CharacterCard, viewAllStyle } from "../_shared";
import type { Profile } from "../_mock-data";

type Tab    = "creations" | "social" | "characters" | "worlds" | "artworks";
type Entity = { id?: string; name: string; hearts: number; images: number; coverImage: string | null };

import { useT } from "@/lib/locale-context";

// ── Picker modal ──────────────────────────────────────────────────────────────

function PickerModal({ all, current, onPick, onClose, title }: {
  all: Entity[];
  current: Entity[];
  onPick: (e: Entity) => void;
  onClose: () => void;
  title: string;
}) {
  const currentNames = new Set(current.map((e) => e.name));
  const available    = all.filter((e) => !currentNames.has(e.name));

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "var(--novae-space-3xl)", width: 480, maxHeight: "70vh", display: "flex", flexDirection: "column", gap: "var(--novae-space-xl)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        {available.length === 0 ? (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", margin: 0 }}>
            All {title.toLowerCase()} are already featured.
          </p>
        ) : (
          <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {available.map((e, i) => (
              <button
                key={i}
                onClick={() => { onPick(e); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(105,61,169,0.08)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: "var(--novae-radius-sm)", background: "rgba(105,61,169,0.15)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                  {e.coverImage && <Image src={e.coverImage} alt={e.name} fill className="object-cover" />}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "var(--novae-text-primary)" }}>{e.name}</span>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>{e.hearts} hearts · {e.images} images</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Editable grid ─────────────────────────────────────────────────────────────

function EditableGrid({ items, all, onRemove, onAdd, addLabel, max = 6 }: {
  items: Entity[];
  all: Entity[];
  onRemove: (i: number) => void;
  onAdd: (e: Entity) => void;
  addLabel: string;
  max?: number;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ position: "relative" }}>
            <CharacterCard {...item} />
            <button
              onClick={() => onRemove(i)}
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--novae-btn-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, lineHeight: 1, zIndex: 2 }}
            >×</button>
          </div>
        ))}
        {items.length < max && (
          <button
            onClick={() => setShowPicker(true)}
            style={{ width: 110, height: 140, borderRadius: "var(--novae-radius-md)", border: "1px dashed var(--novae-outline-all)", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)" }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
            {addLabel}
          </button>
        )}
      </div>
      {showPicker && <PickerModal all={all} current={items} onPick={onAdd} onClose={() => setShowPicker(false)} title={addLabel.replace("Add ", "")} />}
    </>
  );
}

// ── Tab ───────────────────────────────────────────────────────────────────────

export default function CreationsTab({
  characters, worlds, allCharacters, allWorlds, setActiveTab, isEditing,
  onRemoveCharacter, onAddCharacter, onRemoveWorld, onAddWorld,
}: {
  characters: Entity[];
  worlds: Entity[];
  allCharacters: Entity[];
  allWorlds: Entity[];
  setActiveTab: (t: Tab) => void;
  isEditing: boolean;
  onRemoveCharacter: (i: number) => void;
  onAddCharacter: (e: Entity) => void;
  onRemoveWorld: (i: number) => void;
  onAddWorld: (e: Entity) => void;
}) {
  const featuredChars   = characters.slice(0, 6);
  const featuredWorlds  = worlds.slice(0, 6);
  
  const { t, locale, toggle: toggleLocale } = useT();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--novae-space-lg)" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Characters</SectionTitle>
          {!isEditing && <button onClick={() => setActiveTab("characters")} style={viewAllStyle}>View all</button>}
        </div>
        {isEditing ? (
          <EditableGrid items={featuredChars} all={allCharacters} onRemove={onRemoveCharacter} onAdd={onAddCharacter} addLabel={t.profileAddCharacter} />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "flex-start" }}>
            {featuredChars.map((c, i) => <CharacterCard key={i} {...c} />)}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <SectionTitle>Featured Worlds</SectionTitle>
          {!isEditing && <button onClick={() => setActiveTab("worlds")} style={viewAllStyle}>View all</button>}
        </div>
        {isEditing ? (
          <EditableGrid items={featuredWorlds} all={allWorlds} onRemove={onRemoveWorld} onAdd={onAddWorld} addLabel={t.profileAddWorld} />
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {featuredWorlds.map((w, i) => <CharacterCard key={i} {...w} />)}
          </div>
        )}
      </Card>
    </div>
  );
}
