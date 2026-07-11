"use client";

import { NovaeUserSearch } from "./NovaeUserSearch";

export type CreditDraft = { type: "onsite" | "offsite"; value: string; label: string };

export function emptyCredit(): CreditDraft {
  return { type: "onsite", value: "", label: "" };
}

export function creditsValid(credits: CreditDraft[]): boolean {
  return credits.length > 0 && credits.every((c) =>
    c.type === "onsite" ? !!c.value.trim() : !!c.value.trim() && !!c.label.trim()
  );
}

interface ArtworkCreditsEditorProps {
  credits: CreditDraft[];
  onChange: (next: CreditDraft[]) => void;
  meUsername?: string | null;
  inputStyle?: React.CSSProperties;
}

export function ArtworkCreditsEditor({ credits, onChange, meUsername, inputStyle }: ArtworkCreditsEditorProps) {
  const update = (i: number, patch: Partial<CreditDraft>) => {
    onChange(credits.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const remove = (i: number) => onChange(credits.filter((_, idx) => idx !== i));
  const add = () => onChange([...credits, emptyCredit()]);

  const baseInputStyle: React.CSSProperties = {
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
    ...inputStyle,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {credits.map((c, i) => (
        <div
          key={i}
          style={{
            display: "flex", flexDirection: "column", gap: 8,
            paddingBottom: i < credits.length - 1 ? 14 : 0,
            borderBottom: i < credits.length - 1 ? "1px solid var(--novae-outline-all)" : "none",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", borderRadius: "var(--novae-radius-md)", overflow: "hidden", border: "1px solid var(--novae-outline-all)", flex: 1 }}>
              {(["onsite", "offsite"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update(i, { type: t, value: "", label: "" })}
                  style={{
                    flex: 1, padding: "8px 0",
                    background: c.type === t ? "var(--novae-btn-primary)" : "none",
                    border: "none",
                    color: c.type === t ? "#fff" : "var(--novae-text-secondary)",
                    fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)",
                    fontWeight: c.type === t ? 600 : 400, cursor: "pointer",
                  }}
                >
                  {t === "onsite" ? "On Novae" : "Outside website"}
                </button>
              ))}
            </div>
            {credits.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove credit"
                style={{ background: "none", border: "none", color: "var(--novae-text-secondary)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
              >
                ×
              </button>
            )}
          </div>

          {c.type === "onsite" ? (
            <>
              {meUsername && (
                <button
                  type="button"
                  onClick={() => update(i, { value: meUsername })}
                  style={{ alignSelf: "flex-start", background: "none", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-sm)", padding: "3px 10px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
                >
                  Me (@{meUsername})
                </button>
              )}
              <NovaeUserSearch value={c.value} onChange={(v) => update(i, { value: v })} placeholder="Search username…" inputStyle={inputStyle} />
            </>
          ) : (
            <>
              <input
                value={c.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Display name (e.g. AiidenAya)"
                style={baseInputStyle}
              />
              <input
                value={c.value}
                onChange={(e) => update(i, { value: e.target.value })}
                placeholder="https://..."
                style={baseInputStyle}
              />
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: "none", border: "1px dashed var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "8px 14px", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-secondary)", cursor: "pointer" }}
      >
        + Add credit
      </button>
    </div>
  );
}
