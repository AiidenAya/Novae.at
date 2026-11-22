"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import ImageCropModal from "@/components/ImageCropModal";
import { useSession } from "@/lib/auth-client";
import { ArtworkCreditsEditor, creditsValid, type CreditDraft } from "@/components/ui/ArtworkCreditsEditor";
import { useT } from "@/lib/locale-context";

// ── Types ────────────────────────────────────────────────────────────────────

interface CharacterOption {
  id: string;
  name: string;
  avatarUrl: string | null;
  numId: number;
  slug: string;
}

interface ImageEntry {
  file: File;
  preview: string;
  credits: CreditDraft[];
  characters: CharacterOption[];
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  sensitiveType: string | null;
}

// ── Character Picker Modal (multi-select) ────────────────────────────────────

function CharacterPickerModal({
  characters,
  selected,
  onToggle,
  onClose,
}: {
  characters: CharacterOption[];
  selected: CharacterOption[];
  onToggle: (c: CharacterOption) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = characters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const selectedIds = new Set(selected.map((s) => s.id));
  const { t } = useT();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 28, width: 440, maxHeight: "70vh", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-lg)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            Choose characters
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.newMultiSearchchar}
          style={{
            background: "var(--novae-bg-input)",
            border: "1px solid var(--novae-outline-all)",
            borderRadius: "var(--novae-radius-md)",
            outline: "none",
            color: "var(--novae-text-primary)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-base)",
            padding: "10px 14px",
            width: "100%",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--novae-outline-selected)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--novae-outline-all)")}
        />

        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", margin: 0, padding: "8px 0" }}>
              {t.newMultiNoCharFound}
            </p>
          ) : (
            filtered.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => onToggle(c)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px",
                    background: isSelected ? "rgba(105,61,169,0.14)" : "rgba(105,61,169,0.04)",
                    border: `1px solid ${isSelected ? "var(--novae-outline-selected)" : "var(--novae-outline-all)"}`,
                    borderRadius: "var(--novae-radius-md)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "var(--novae-radius-sm)", background: "rgba(105,61,169,0.15)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                    {c.avatarUrl && <Image src={c.avatarUrl} alt={c.name} fill style={{ objectFit: "cover" }} />}
                  </div>
                  <span style={{ flex: 1, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, color: "var(--novae-text-primary)" }}>
                    {c.name}
                  </span>
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--novae-btn-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          style={{ padding: "10px 0", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, cursor: "pointer" }}
        >
          Done{selected.length > 0 ? ` (${selected.length})` : ""}
        </button>
      </div>
    </div>
  );
}

// ── Artist Modal ─────────────────────────────────────────────────────────────

function ArtistModal({
  entry,
  meUsername,
  onSave,
  onClose,
}: {
  entry: ImageEntry;
  meUsername?: string | null;
  onSave: (credits: CreditDraft[]) => void;
  onClose: () => void;
}) {
  const [credits, setCredits] = useState<CreditDraft[]>(entry.credits);
  const { t } = useT();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "transparent", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 32, width: "min(560px, calc(100vw - 32px))", display: "flex", flexDirection: "column", gap: 20 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
            {t.newMultiWho}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <ArtworkCreditsEditor credits={credits} onChange={setCredits} meUsername={meUsername} />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}
          >
            {t.cancel}
          </button>
          <button
            disabled={!creditsValid(credits)}
            onClick={() => { if (!creditsValid(credits)) return; onSave(credits); onClose(); }}
            style={{
              flex: 2, padding: "10px 0",
              background: creditsValid(credits) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
              border: "none", borderRadius: "var(--novae-radius-md)",
              color: creditsValid(credits) ? "#fff" : "var(--novae-text-secondary)",
              fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600,
              cursor: creditsValid(credits) ? "pointer" : "not-allowed",
            }}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewMultiImagePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const meUsername = (session?.user as { username?: string } | undefined)?.username ?? null;
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [artistModal, setArtistModal] = useState<number | null>(null);
  const [charModal, setCharModal] = useState<number | null>(null);
  const [cropModal, setCropModal] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("characterImage");
  const { t } = useT();

  useEffect(() => {
    fetch("/api/characters").then((r) => r.json()).then(setCharacters).catch(() => {});
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newEntries: ImageEntry[] = imgs.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      credits: [{ type: "onsite", value: meUsername ?? "", label: "" }],
      characters: [],
      thumbnailFile: null,
      thumbnailPreview: null,
      sensitiveType: null,
    }));
    setEntries((prev) => [...prev, ...newEntries]);
  }, [meUsername]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeEntry = (i: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const updateArtist = (i: number, credits: CreditDraft[]) => {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, credits } : e));
  };

  const setThumbnail = (i: number, file: File | null, preview: string | null) => {
    setEntries((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      if (e.thumbnailPreview) URL.revokeObjectURL(e.thumbnailPreview);
      return { ...e, thumbnailFile: file, thumbnailPreview: preview };
    }));
  };

  const toggleCharacter = (i: number, c: CharacterOption) => {
    setEntries((prev) => prev.map((e, idx) => {
      if (idx !== i) return e;
      const already = e.characters.some((x) => x.id === c.id);
      return { ...e, characters: already ? e.characters.filter((x) => x.id !== c.id) : [...e.characters, c] };
    }));
  };

  const creditsSummary = (entry: ImageEntry) => {
    if (entry.credits.length === 0) return t.newAddCredits;
    const first = entry.credits[0];
    const firstLabel = first.type === "onsite"
      ? (first.value ? `@${first.value}` : t.newOnsite)
      : (first.label || first.value || "External");
    const moreCredits = t.newMoreCredits.replace("{first}", firstLabel).replace("{others}", String(entry.credits.length - 1))
    return entry.credits.length > 1 ? moreCredits : firstLabel;
  };

  const handleUpload = async () => {
    if (entries.length === 0) return;
    setUploading(true);
    try {
      // Upload all files at once
      const uploaded = await startUpload(entries.map((e) => e.file));
      if (!uploaded?.length) return;

      // Upload thumbnails (only entries that have one), then map back by index
      const thumbTargets = entries.map((e, i) => ({ e, i })).filter((x) => x.e.thumbnailFile);
      const thumbUrls: Record<number, string> = {};
      if (thumbTargets.length > 0) {
        const upThumbs = await startUpload(thumbTargets.map((x) => x.e.thumbnailFile!));
        thumbTargets.forEach((x, k) => {
          const url = upThumbs?.[k]?.ufsUrl;
          if (url) thumbUrls[x.i] = url;
        });
      }

      // One POST per image — all characters connected at once
      const charactersSeen = new Map<string, CharacterOption>();

      await Promise.all(
        entries.map((entry, i) => {
          const imageUrl = uploaded[i]?.ufsUrl;
          if (!imageUrl) return Promise.resolve();

          const credits = entry.credits.map((c) => ({ type: c.type, value: c.value.trim(), label: c.label.trim() }));

          entry.characters.forEach((c) => charactersSeen.set(c.id, c));

          return fetch("/api/artworks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl,
              thumbnailUrl: thumbUrls[i] ?? null,
              credits,
              characterIds: entry.characters.map((c) => c.id),
              sensitiveType: entry.sensitiveType,
            }),
          });
        })
      );

      const uniqueChars = [...charactersSeen.values()];
      if (uniqueChars.length === 1) {
        router.push(`/library/characters/${uniqueChars[0].numId}-${uniqueChars[0].slug}`);
      } else {
        router.push("/library/characters");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ minHeight: "100%", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 32px" }}>
      <div style={{ width: "100%", maxWidth: 860, display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
            {t.newMulti}
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)", margin: 0 }}>
            {t.newMultiDesc}
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--novae-outline-selected)" : "var(--novae-outline-all)"}`,
            borderRadius: "var(--novae-radius-md)",
            padding: "48px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            background: dragging ? "rgba(105,61,169,0.06)" : "var(--novae-bg-card)",
            transition: "border-color 0.15s, background 0.15s",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--novae-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-secondary)", textAlign: "center" }}>
            {t.newMultiDragdrop} <span style={{ color: "var(--novae-text-link)", fontWeight: 600 }}>{t.browse}</span>
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
            {t.novaeFormat}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* Image list */}
        {entries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((entry, i) => (
              <div
                key={entry.preview}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: "var(--novae-bg-card)",
                  border: "1px solid var(--novae-outline-all)",
                  borderRadius: "var(--novae-radius-md)",
                  padding: "12px 16px",
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 64, height: 64, borderRadius: "var(--novae-radius-sm)", overflow: "hidden", flexShrink: 0, position: "relative", background: "rgba(105,61,169,0.1)" }}>
                  <Image src={entry.preview} alt={entry.file.name} fill style={{ objectFit: "cover" }} unoptimized />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.file.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
                    {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>

                {/* Artist button */}
                <button
                  onClick={() => setArtistModal(i)}
                  style={{
                    padding: "6px 14px",
                    background: creditsValid(entry.credits) ? "rgba(105,61,169,0.1)" : "none",
                    border: "1px solid var(--novae-outline-all)",
                    borderRadius: "var(--novae-radius-sm)",
                    color: "var(--novae-text-primary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                    fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {creditsSummary(entry)}
                </button>

                {/* Character button */}
                <button
                  onClick={() => setCharModal(i)}
                  style={{
                    padding: "6px 14px",
                    background: entry.characters.length > 0 ? "rgba(105,61,169,0.1)" : "none",
                    border: "1px solid var(--novae-outline-all)",
                    borderRadius: "var(--novae-radius-sm)",
                    color: entry.characters.length > 0 ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                    fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  {entry.characters.length === 0
                    ? t.newMultiNochar
                    : entry.characters.length === 1
                      ? entry.characters[0].name
                      : `${entry.characters.length} ${t.characters}`}
                </button>

                {/* Thumbnail button */}
                <button
                  onClick={() => setCropModal(i)}
                  style={{
                    padding: "6px 14px",
                    background: entry.thumbnailPreview ? "rgba(105,61,169,0.1)" : "none",
                    border: "1px solid var(--novae-outline-all)",
                    borderRadius: "var(--novae-radius-sm)",
                    color: entry.thumbnailPreview ? "var(--novae-text-primary)" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                    fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                    display: "flex", alignItems: "center", gap: 6,
                  }}
                >
                  {entry.thumbnailPreview ? (
                    <span style={{ width: 16, height: 16, borderRadius: 3, overflow: "hidden", flexShrink: 0, display: "block" }}>
                      <img src={entry.thumbnailPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </span>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                  {entry.thumbnailPreview ? t.newMultiThmb : t.newMultiThmbcrop}
                </button>

                {/* Sensitive type buttons */}
                {(["nudity", "gore"] as const).map((val) => {
                  const active = entry.sensitiveType === val;
                  return (
                    <button
                      key={val}
                      onClick={() => setEntries((prev) => prev.map((e, j) => j === i ? { ...e, sensitiveType: active ? null : val } : e))}
                      title={val === "nudity" ? t.nudityVerbose : t.goreVerbose}
                      style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                        background: active ? "rgba(192,32,90,0.12)" : "none",
                        border: `1px solid ${active ? "var(--novae-accent-main, #c0205a)" : "var(--novae-outline-all)"}`,
                        borderRadius: "var(--novae-radius-sm)",
                        color: active ? "var(--novae-accent-main, #c0205a)" : "var(--novae-text-secondary)",
                        fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)",
                        fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      {val === "nudity" ? t.nudity : t.gore}
                    </button>
                  );
                })}

                {/* Remove */}
                <button
                  onClick={() => removeEntry(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ flex: 1, padding: "14px 24px", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", fontWeight: 600, cursor: "pointer" }}
          >
            {t.cancel}
          </button>
          <button
            onClick={handleUpload}
            disabled={entries.length === 0 || uploading || !entries.every((e) => creditsValid(e.credits))}
            style={{
              flex: 2, padding: "14px 24px",
              background: entries.length > 0 && !uploading && entries.every((e) => creditsValid(e.credits)) ? "var(--novae-btn-primary)" : "var(--novae-bg-card)",
              border: "none", borderRadius: "var(--novae-radius-md)",
              color: "var(--novae-text-btn)", fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-lg)", fontWeight: 600,
              cursor: entries.length > 0 && !uploading && entries.every((e) => creditsValid(e.credits)) ? "pointer" : "not-allowed",
              opacity: entries.length > 0 && !uploading && entries.every((e) => creditsValid(e.credits)) ? 1 : 0.5,
              transition: "opacity 0.15s, background 0.15s",
            }}
          >
            {uploading ? t.uploading : `${t.newMultiUpload} ${entries.length} image${entries.length > 1 ? "s" : ""} →`}
          </button>
        </div>
      </div>

      {/* Artist modal */}
      {artistModal !== null && entries[artistModal] && (
        <ArtistModal
          entry={entries[artistModal]}
          meUsername={meUsername}
          onSave={(credits) => updateArtist(artistModal, credits)}
          onClose={() => setArtistModal(null)}
        />
      )}

      {/* Character picker modal */}
      {charModal !== null && entries[charModal] && (
        <CharacterPickerModal
          characters={characters}
          selected={entries[charModal].characters}
          onToggle={(c) => toggleCharacter(charModal, c)}
          onClose={() => setCharModal(null)}
        />
      )}

      {/* Thumbnail crop modal */}
      {cropModal !== null && entries[cropModal] && (
        <ImageCropModal
          src={entries[cropModal].preview}
          filename={entries[cropModal].file.name}
          originalFile={entries[cropModal].file}
          aspect={1}
          onConfirm={(file, preview) => {
            setThumbnail(cropModal, file, preview);
            setCropModal(null);
          }}
          onCancel={() => setCropModal(null)}
        />
      )}
    </div>
  );
}
