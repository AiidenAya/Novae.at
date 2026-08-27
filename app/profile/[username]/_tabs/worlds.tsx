"use client";

import { useState } from "react";
import { Card, CharacterCard } from "../_shared";
import type { LibraryFolder } from "../_mock-data";

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function FolderSection({ folder, isEditing, onRemove }: {
  folder: LibraryFolder;
  isEditing: boolean;
  onRemove: (itemIndex: number) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-primary)", textAlign: "left" }}
      >
        <span style={{ color: "var(--novae-text-secondary)" }}><IconChevron open={open} /></span>
        <span style={{ color: "var(--novae-text-link)" }}><IconGlobe /></span>
        <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "var(--novae-text-primary)" }}>
          {folder.name}
        </span>
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
          {folder.items.length}
        </span>
      </button>

      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, paddingLeft: 24, paddingBottom: 8 }}>
          {folder.items.map((item, itemIdx) => (
            <div key={itemIdx} style={{ position: "relative" }}>
              <CharacterCard {...item} />
              {isEditing && (
                <button
                  onClick={() => onRemove(itemIdx)}
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--novae-btn-primary)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, lineHeight: 1, zIndex: 2 }}
                >×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: "var(--novae-outline-all)", margin: "4px 0" }} />
    </div>
  );
}

export default function WorldsTab({ folders, isEditing }: {
  folders: LibraryFolder[];
  isEditing: boolean;
}) {
  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {folders.map((folder, fi) => (
          <FolderSection
            key={folder.id}
            folder={folder}
            isEditing={isEditing}
            onRemove={() => {}}
          />
        ))}
      </div>
    </Card>
  );
}
