"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const EditorField    = dynamic(() => import("@/components/editor/EditorField"),    { ssr: false });
const EditorRenderer = dynamic(() => import("@/components/editor/EditorRenderer"), { ssr: false });
import { useUploadThing } from "@/lib/uploadthing-client";

// ─── Types ─────────────────────────────────────────────────────────────────

type Swatch = { id?: string; hex: string; label: string | null };
type Tag    = { tagId: string; tag: { id: string; name: string } };
type Artwork = { id: string; imageUrl: string; title: string | null; characters: { id: string; name: string; numId: number; slug: string }[] };

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

  // Lightbox
  const [lightbox, setLightbox] = useState<{ url: string; artist: string | null } | null>(null);

  // Creator modal
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [pendingIsAvatar, setPendingIsAvatar] = useState(false);
  const [pendingCreatorType, setPendingCreatorType] = useState<"onsite" | "offsite">("onsite");
  const [pendingCreator, setPendingCreator] = useState("");
  const [pendingCreatorLabel, setPendingCreatorLabel] = useState("");

  // Informations: which fields are visible
  const ALL_INFO_FIELDS: { key: string; label: string; state: string; setter: React.Dispatch<React.SetStateAction<string>>; dbVal: string | null; multiline?: boolean; fieldType?: "gender" | "custom" }[] = [
    { key: "gender",      label: "Genre",       state: gender,      setter: setGender,      dbVal: character.gender,      fieldType: "gender" },
    { key: "orientation", label: "Orientation", state: orientation, setter: setOrientation, dbVal: character.orientation },
    { key: "birthdate",  label: "Birthdate",  state: birthdate,  setter: setBirthdate,  dbVal: character.birthdate },
    { key: "age",        label: "Age",        state: age,        setter: setAge,        dbVal: character.age },
    { key: "height",     label: "Height",     state: height,     setter: setHeight,     dbVal: character.height },
    { key: "weight",     label: "Weight",     state: weight,     setter: setWeight,     dbVal: character.weight },
    { key: "mbti",       label: "MBTI",       state: mbti,       setter: setMbti,       dbVal: character.mbti },
    { key: "kingdom",    label: "Kingdom",    state: kingdom,    setter: setKingdom,    dbVal: character.kingdom },
    { key: "ethnicity",  label: "Ethnicity",  state: ethnicity,  setter: setEthnicity,  dbVal: character.ethnicity },
    { key: "race",       label: "Race",       state: race,       setter: setRace,       dbVal: character.race },
    { key: "custom",     label: customFieldName || "Custom",  state: custom, setter: setCustom, dbVal: character.custom, multiline: true, fieldType: "custom" },
  ];
  const [activeInfoKeys, setActiveInfoKeys] = useState<string[]>(
    ALL_INFO_FIELDS.filter((f) => !!f.dbVal).map((f) => f.key)
  );
  const [showInfoFieldPicker, setShowInfoFieldPicker] = useState(false);

  // Custom containers
  type Container = { id: string; title: string };
  const [customContainers, setCustomContainers] = useState<Container[]>([]);

  // Edit credits modal
  const [editingCredits, setEditingCredits] = useState<Artwork | null>(null);
  const [creditsType, setCreditsType] = useState<"onsite" | "offsite">("onsite");
  const [creditsValue, setCreditsValue] = useState("");
  const [creditsLabel, setCreditsLabel] = useState("");

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
      const charRes = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, description, birthdate, age, height, weight, mbti, kingdom, ethnicity, race, gender, orientation, customFieldName, custom, voiceClaimUrl, avatarUrl,
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
      const charData = charRes.ok ? await charRes.json() : null;

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
    } finally {
      setSaving(false);
    }
  }, [character.id, name, description, birthdate, age, height, weight, mbti, kingdom, ethnicity, race, gender, orientation, customFieldName, custom, voiceClaimUrl, avatarUrl, isDesigner, creditType, creditValue, creditLabel, isWriter, writerType, writerValue, writerLabel, swatches, router]);

  const cancelEdit = () => {
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
    setIsDesigner(character.isDesigner);
    const p = parseCredit(character.designerCredit);
    setCreditType(p.type); setCreditValue(p.value); setCreditLabel(p.label);
    setIsWriter(character.isWriter);
    const pw = parseCredit(character.writerCredit);
    setWriterType(pw.type); setWriterValue(pw.value); setWriterLabel(pw.label);
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

  const uploadArtwork = async (files: File[], isAvatar = false, creator?: string, creatorType?: "onsite" | "offsite") => {
    setUploadingImage(true);
    try {
      const uploaded = isAvatar
        ? await startAvatarUpload(files)
        : await startArtworkUpload(files);

      if (!uploaded?.length) return;

      if (isAvatar) {
        const url = uploaded[0].ufsUrl;
        setAvatarUrl(url);
        // Save avatarUrl on character
        await fetch(`/api/characters/${character.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: url }),
        });
        // Also add to gallery
        const res = await fetch(`/api/characters/${character.id}/artworks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: url, title: creator || "Avatar" }),
        });
        if (res.ok) {
          const artwork = await res.json();
          setArtworks((prev) => [artwork, ...prev]);
        }
        router.refresh();
      } else {
        for (const file of uploaded) {
          const res = await fetch(`/api/characters/${character.id}/artworks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: file.ufsUrl,
              title: creator || file.name.replace(/\.[^.]+$/, ""),
            }),
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

  const openEditCredits = (artwork: Artwork) => {
    const title = artwork.title ?? "";
    if (title.startsWith("@")) {
      setCreditsType("onsite");
      setCreditsValue(title.slice(1));
      setCreditsLabel("");
    } else if (title.includes("::")) {
      const [label, url] = title.split("::");
      setCreditsType("offsite");
      setCreditsLabel(label);
      setCreditsValue(url);
    } else {
      setCreditsType("onsite");
      setCreditsValue(title);
      setCreditsLabel("");
    }
    setEditingCredits(artwork);
  };

  const saveCredits = async () => {
    if (!editingCredits) return;
    const raw = creditsValue.trim();
    const label = creditsLabel.trim();
    const newTitle = creditsType === "onsite"
      ? `@${raw.replace(/^@/, "")}`
      : label ? `${label}::${raw}` : raw;
    await fetch(`/api/characters/${character.id}/artworks/${editingCredits.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setArtworks((prev) => prev.map((a) => a.id === editingCredits.id ? { ...a, title: newTitle } : a));
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

  const visibleInfoFields = ALL_INFO_FIELDS.filter((f) => activeInfoKeys.includes(f.key));

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
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) { setPendingFiles(files); setPendingIsAvatar(false); setPendingCreator(""); }
          e.target.value = "";
        }}
      />
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) { setPendingFiles(files); setPendingIsAvatar(true); setPendingCreator(""); }
          e.target.value = "";
        }}
      />

      {/* ── Edit credits modal ────────────────────────────────────────── */}
      {editingCredits && (
        <div
          onClick={() => setEditingCredits(null)}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#141820", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-lg)", padding: 32, width: 420, display: "flex", flexDirection: "column", gap: 20 }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Edit credits
            </h2>

            {/* Toggle */}
            <div style={{ display: "flex", borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
              {(["onsite", "offsite"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setCreditsType(t); setCreditsValue(""); setCreditsLabel(""); }}
                  style={{
                    flex: 1, padding: "8px 0",
                    background: creditsType === t ? "var(--novae-btn-primary)" : "none",
                    border: "none",
                    color: creditsType === t ? "#fff" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                    fontWeight: creditsType === t ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {t === "onsite" ? "On Novae" : "External"}
                </button>
              ))}
            </div>

            {creditsType === "offsite" && (
              <input
                autoFocus
                value={creditsLabel}
                onChange={(e) => setCreditsLabel(e.target.value)}
                placeholder="Display name (e.g. AiidenAya)"
                style={{ ...inputStyle, fontSize: "var(--novae-text-base)" }}
              />
            )}
            <input
              autoFocus={creditsType === "onsite"}
              value={creditsValue}
              onChange={(e) => setCreditsValue(e.target.value)}
              placeholder={creditsType === "onsite" ? "username" : "https://..."}
              onKeyDown={(e) => { if (e.key === "Enter") saveCredits(); }}
              style={{ ...inputStyle, fontSize: "var(--novae-text-base)" }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setEditingCredits(null)}
                style={{ flex: 1, padding: "10px 0", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", cursor: "pointer" }}
              >Cancel</button>
              <button
                disabled={!creditsValue.trim() || (creditsType === "offsite" && !creditsLabel.trim())}
                onClick={saveCredits}
                style={{
                  flex: 1, padding: "10px 0",
                  background: (creditsValue.trim() && (creditsType === "onsite" || creditsLabel.trim())) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
                  border: "none", borderRadius: "var(--novae-radius-md)",
                  color: (creditsValue.trim() && (creditsType === "onsite" || creditsLabel.trim())) ? "#fff" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                  fontWeight: 600, cursor: (creditsValue.trim() && (creditsType === "onsite" || creditsLabel.trim())) ? "pointer" : "not-allowed",
                }}
              >Save</button>
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
            background: "rgba(0,0,0,0.85)",
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
          {lightbox.artist && (
            <p
              onClick={(e) => e.stopPropagation()}
              style={{
                fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                color: "rgba(255,255,255,0.7)", margin: 0,
              }}
            >
              Art by{" "}
              {lightbox.artist.startsWith("@") ? (
                <a
                  href={`/${lightbox.artist.slice(1)}`}
                  style={{ color: "var(--novae-text-link)", textDecoration: "none" }}
                >
                  {lightbox.artist}
                </a>
              ) : lightbox.artist.includes("::") ? (() => {
                const [label, url] = lightbox.artist!.split("::");
                return (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--novae-text-link)", textDecoration: "none" }}
                  >
                    {label}
                  </a>
                );
              })() : lightbox.artist.startsWith("http") ? (
                <a
                  href={lightbox.artist}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--novae-text-link)", textDecoration: "none" }}
                >
                  {lightbox.artist}
                </a>
              ) : (
                lightbox.artist
              )}
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

      {/* ── Creator modal ─────────────────────────────────────────────── */}
      {pendingFiles && (
        <div
          onClick={() => setPendingFiles(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--novae-bg-card)",
              border: "1px solid var(--novae-outline-all)",
              borderRadius: "var(--novae-radius-lg)",
              padding: 32,
              width: 420,
              display: "flex", flexDirection: "column", gap: 20,
            }}
          >
            <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
              Who made {pendingFiles.length > 1 ? "these images" : "this image"}?
            </h2>
            <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
              {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} selected.
            </p>

            {/* Toggle onsite / offsite */}
            <div style={{ display: "flex", borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
              {(["onsite", "offsite"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setPendingCreatorType(t); setPendingCreator(""); setPendingCreatorLabel(""); }}
                  style={{
                    flex: 1, padding: "8px 0",
                    background: pendingCreatorType === t ? "var(--novae-btn-primary)" : "none",
                    border: "none",
                    color: pendingCreatorType === t ? "#fff" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                    fontWeight: pendingCreatorType === t ? 600 : 400,
                    cursor: "pointer",
                  }}
                >
                  {t === "onsite" ? "On Novae" : "External"}
                </button>
              ))}
            </div>

            {pendingCreatorType === "offsite" && (
              <input
                autoFocus
                value={pendingCreatorLabel}
                onChange={(e) => setPendingCreatorLabel(e.target.value)}
                placeholder="Display name (e.g. AiidenAya)"
                style={{ ...inputStyle, fontSize: "var(--novae-text-base)" }}
              />
            )}
            <input
              autoFocus={pendingCreatorType === "onsite"}
              value={pendingCreator}
              onChange={(e) => setPendingCreator(e.target.value)}
              placeholder={pendingCreatorType === "onsite" ? "username" : "https://twitter.com/..."}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pendingCreator.trim()) {
                  const files = pendingFiles!;
                  const isAvatar = pendingIsAvatar;
                  const raw = pendingCreator.trim();
                  const label = pendingCreatorLabel.trim();
                  const creator = pendingCreatorType === "onsite"
                    ? `@${raw.replace(/^@/, "")}`
                    : label ? `${label}::${raw}` : raw;
                  setPendingFiles(null);
                  uploadArtwork(files, isAvatar, creator, pendingCreatorType);
                }
              }}
              style={{ ...inputStyle, fontSize: "var(--novae-text-base)" }}
            />

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setPendingFiles(null)}
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
                disabled={!pendingCreator.trim() || (pendingCreatorType === "offsite" && !pendingCreatorLabel.trim())}
                onClick={() => {
                  const files = pendingFiles!;
                  const isAvatar = pendingIsAvatar;
                  const raw = pendingCreator.trim();
                  const label = pendingCreatorLabel.trim();
                  const creator = pendingCreatorType === "onsite"
                    ? `@${raw.replace(/^@/, "")}`
                    : label ? `${label}::${raw}` : raw;
                  setPendingFiles(null);
                  uploadArtwork(files, isAvatar, creator, pendingCreatorType);
                }}
                style={{
                  flex: 1, padding: "10px 0",
                  background: (pendingCreator.trim() && (pendingCreatorType === "onsite" || pendingCreatorLabel.trim())) ? "var(--novae-btn-primary)" : "var(--novae-bg-input)",
                  border: "none",
                  borderRadius: "var(--novae-radius-md)",
                  color: (pendingCreator.trim() && (pendingCreatorType === "onsite" || pendingCreatorLabel.trim())) ? "#fff" : "var(--novae-text-secondary)",
                  fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)",
                  fontWeight: 600, cursor: (pendingCreator.trim() && (pendingCreatorType === "onsite" || pendingCreatorLabel.trim())) ? "pointer" : "not-allowed",
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
                      fontSize: "var(--novae-text-5xl)",
                      fontWeight: 700,
                      padding: "8px 12px",
                    }}
                  />
                ) : (
                  <h1
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

                {editing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description du personnage…"
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
                  {/* Designer — view mode */}
                  {!editing && (() => {
                    if (character.isDesigner) {
                      return <MetaItem label="Designer" value={`@${character.user.username}`} href={`/${character.user.username}`} />;
                    }
                    if (!character.designerCredit) return null;
                    if (character.designerCredit.startsWith("@")) {
                      const u = character.designerCredit.slice(1);
                      return <MetaItem label="Designer" value={`@${u}`} href={`/${u}`} />;
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
                          <input
                            value={creditValue}
                            onChange={(e) => setCreditValue(e.target.value)}
                            placeholder={creditType === "onsite" ? "username" : "https://..."}
                            style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                          />
                        </>
                      )}
                    </div>
                  )}
                  {/* Writer — view mode */}
                  {!editing && (() => {
                    if (character.isWriter) {
                      return <MetaItem label="Writer" value={`@${character.user.username}`} href={`/${character.user.username}`} />;
                    }
                    if (!character.writerCredit) return null;
                    if (character.writerCredit.startsWith("@")) {
                      const u = character.writerCredit.slice(1);
                      return <MetaItem label="Writer" value={`@${u}`} href={`/${u}`} />;
                    }
                    const m = character.writerCredit.match(/^\[(.+)\]\((.+)\)$/);
                    if (m) return <MetaItem label="Writer" value={m[1]} href={m[2]} />;
                    return <MetaItem label="Writer" value={character.writerCredit} />;
                  })()}
                  {/* Writer — edit mode */}
                  {editing && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", fontWeight: 700, color: "var(--novae-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Writer
                      </span>
                      <div style={{ display: "flex", borderRadius: "var(--novae-radius-sm)", overflow: "hidden", border: "1px solid var(--novae-outline-all)" }}>
                        {([
                          { key: "me",      label: "Me" },
                          { key: "onsite",  label: "Novae" },
                          { key: "offsite", label: "Outside website" },
                        ] as const).map(({ key, label }) => {
                          const active = key === "me" ? isWriter : (!isWriter && writerType === key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                if (key === "me") { setIsWriter(true); }
                                else { setIsWriter(false); setWriterType(key); setWriterValue(""); setWriterLabel(""); }
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
                      {!isWriter && (
                        <>
                          {writerType === "offsite" && (
                            <input
                              value={writerLabel}
                              onChange={(e) => setWriterLabel(e.target.value)}
                              placeholder="Nom de l'auteur"
                              style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                            />
                          )}
                          <input
                            value={writerValue}
                            onChange={(e) => setWriterValue(e.target.value)}
                            placeholder={writerType === "onsite" ? "username" : "https://..."}
                            style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                          />
                        </>
                      )}
                    </div>
                  )}
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
                          {ALL_INFO_FIELDS.every((f) => activeInfoKeys.includes(f.key)) && (
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
                    {visibleInfoFields.map(({ key, label, state, setter, dbVal, multiline, fieldType }) => {
                      const value = editing ? state : dbVal;
                      const GENDER_PRESETS = ["Homme", "Femme", "Non-binaire", "Iel", "Autre"];
                      const isGenderCustom = fieldType === "gender" && value !== "" && !GENDER_PRESETS.includes(value ?? "");
                      const displayLabel = fieldType === "custom" ? (editing ? customFieldName || "Custom" : character.customFieldName || "Custom") : label;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: (multiline || fieldType === "gender") ? "flex-start" : "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 700, color: "var(--novae-text-secondary)", width: "45%", flexShrink: 0, paddingTop: (multiline || fieldType === "gender") ? 6 : 0 }}>
                            {displayLabel}
                          </span>
                          {editing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                              {fieldType === "gender" ? (
                                <>
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                                    {GENDER_PRESETS.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setter(state === opt ? "" : opt)}
                                        style={{ padding: "4px 10px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", background: state === opt ? "var(--novae-btn-primary)" : "none", color: state === opt ? "#fff" : "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", cursor: "pointer" }}
                                      >{opt}</button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setter(isGenderCustom ? "" : "custom-")}
                                      style={{ padding: "4px 10px", borderRadius: "var(--novae-radius-sm)", border: "1px solid var(--novae-outline-all)", background: isGenderCustom ? "var(--novae-btn-primary)" : "none", color: isGenderCustom ? "#fff" : "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", cursor: "pointer" }}
                                    >Custom</button>
                                    <button
                                      onClick={() => setActiveInfoKeys((prev) => prev.filter((k) => k !== key))}
                                      style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "0 4px", marginLeft: "auto" }}
                                    >×</button>
                                  </div>
                                  {isGenderCustom && (
                                    <input
                                      value={state.startsWith("custom-") ? state.slice(7) : state}
                                      onChange={(e) => setter("custom-" + e.target.value)}
                                      placeholder="Mon genre…"
                                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                                    />
                                  )}
                                </>
                              ) : fieldType === "custom" ? (
                                <>
                                  <input
                                    value={customFieldName}
                                    onChange={(e) => setCustomFieldName(e.target.value)}
                                    placeholder="Nom du champ…"
                                    style={{ ...inputStyle, fontSize: "var(--novae-text-sm)" }}
                                  />
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <textarea
                                      value={state ?? ""}
                                      onChange={(e) => setter(e.target.value)}
                                      placeholder="Contenu…"
                                      rows={3}
                                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1, resize: "vertical", minHeight: 64 }}
                                    />
                                    <button
                                      onClick={() => setActiveInfoKeys((prev) => prev.filter((k) => k !== key))}
                                      style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "0 4px", alignSelf: "flex-start" }}
                                    >×</button>
                                  </div>
                                </>
                              ) : (
                                <div style={{ display: "flex", gap: 4 }}>
                                  {multiline ? (
                                    <textarea
                                      value={state ?? ""}
                                      onChange={(e) => setter(e.target.value)}
                                      placeholder="—"
                                      rows={3}
                                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1, resize: "vertical", minHeight: 64 }}
                                    />
                                  ) : (
                                    <input
                                      value={state ?? ""}
                                      onChange={(e) => setter(e.target.value)}
                                      placeholder="—"
                                      style={{ ...inputStyle, fontSize: "var(--novae-text-sm)", flex: 1 }}
                                    />
                                  )}
                                  <button
                                    onClick={() => setActiveInfoKeys((prev) => prev.filter((k) => k !== key))}
                                    style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}
                                  >×</button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", whiteSpace: multiline ? "pre-wrap" : undefined }}>
                              {fieldType === "gender" && value?.startsWith("custom-") ? value.slice(7) : (value || "—")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {visibleInfoFields.length === 0 && !editing && (
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
              <div className="char-body-main gap-6">
                {/* Latest images */}
                <SectionCard title="Latest Images">
                  <div style={{ display: "flex", gap: 8, maxHeight: 200, overflow: "hidden" }}>
                    {latestImages.length > 0 ? latestImages.map((artwork) => (
                      <div
                        key={artwork.id}
                        onClick={() => setLightbox({ url: artwork.imageUrl, artist: artwork.title })}
                        style={{
                          width: 160, height: 160, flexShrink: 0,
                          borderRadius: "var(--novae-radius-md)",
                          overflow: "hidden",
                          backgroundColor: "var(--novae-bg-main)",
                          position: "relative",
                          cursor: "zoom-in",
                        }}
                      >
                        <Image src={artwork.imageUrl} alt={artwork.title ?? ""} fill className="object-cover" />
                      </div>
                    )) : null}
                  </div>
                  <button
                    onClick={() => setActiveTab("gallery")}
                    style={{ alignSelf: "flex-end", background: "none", border: "none", color: "var(--novae-text-link)", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", cursor: "pointer" }}
                  >
                    View all ({artworks.length}) →
                  </button>
                </SectionCard>

                {/* Custom containers */}
                {customContainers.map((container) => (
                  <SectionCard
                    key={container.id}
                    title={
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
                    }
                    action={
                      <button
                        onClick={() => setCustomContainers((prev) => prev.filter((c) => c.id !== container.id))}
                        style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
                      >×</button>
                    }
                  >
                    <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)" }}>
                      Empty section — content coming soon.
                    </p>
                  </SectionCard>
                ))}

                {isOwner && (
                  <button
                    onClick={() => setCustomContainers((prev) => [...prev, { id: crypto.randomUUID(), title: "" }])}
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
                  No images yet.{isOwner ? ' Click "Add images" to get started.' : ""}
                </p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  {artworks.map((artwork) => (
                    <div
                      key={artwork.id}
                      onClick={() => setLightbox({ url: artwork.imageUrl, artist: artwork.title })}
                      style={{
                        position: "relative",
                        aspectRatio: "1",
                        borderRadius: "var(--novae-radius-md)",
                        overflow: "hidden",
                        backgroundColor: "var(--novae-bg-card)",
                        cursor: "zoom-in",
                      }}
                    >
                      <Image src={artwork.imageUrl} alt={artwork.title ?? ""} fill className="object-cover" />
                      {isOwner && (
                        <div
                          className="artwork-actions"
                          style={{
                            position: "absolute", top: 6, right: 6,
                            display: "flex", gap: 4,
                            opacity: 0, transition: "opacity 0.15s",
                          }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditCredits(artwork); }}
                            style={{
                              width: 28, height: 28,
                              background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                              color: "#fff", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            title="Edit credits"
                          >
                            <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteArtwork(artwork.id); }}
                            style={{
                              width: 28, height: 28,
                              background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                              color: "#fff", cursor: "pointer", fontSize: 14,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                            title="Delete"
                          >×</button>
                        </div>
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
