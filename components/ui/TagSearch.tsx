"use client";

import { useEffect, useRef, useState } from "react";

interface TagResult {
  id: string;
  name: string;
}

interface TagSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (name: string) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  disabled?: boolean;
}

export function TagSearch({ value, onChange, onSelect, placeholder = "Add a tag…", inputStyle, disabled }: TagSearchProps) {
  const [results, setResults] = useState<TagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!value.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.tags ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  const baseInputStyle: React.CSSProperties = {
    background: "var(--novae-bg-input)",
    border: "1px solid var(--novae-outline-all)",
    borderRadius: "var(--novae-radius-md)",
    outline: "none",
    color: "var(--novae-text-primary)",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "var(--novae-text-sm)",
    padding: "6px 10px",
    width: "100%",
    boxSizing: "border-box",
    ...inputStyle,
  };

  const commit = (name: string) => {
    onSelect(name);
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (value.trim()) commit(value.trim());
          }
        }}
        placeholder={placeholder}
        style={baseInputStyle}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--novae-text-secondary)" }}>…</span>
      )}
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
          {results.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => commit(t.name)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
