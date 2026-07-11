"use client";

import { useEffect, useRef, useState } from "react";

interface NovaeUserResult {
  id: string;
  username: string;
  name: string | null;
  avatar: string | null;
}

interface NovaeUserSearchProps {
  value: string;
  onChange: (username: string) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  autoFocus?: boolean;
}

export function NovaeUserSearch({ value, onChange, placeholder = "Search username…", inputStyle, autoFocus }: NovaeUserSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NovaeUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?multi=1&q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users ?? []);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

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
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => { setOpen(true); e.currentTarget.style.borderColor = "var(--novae-outline-selected)"; }}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--novae-outline-all)")}
        placeholder={placeholder}
        style={baseInputStyle}
      />
      {loading && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--novae-text-secondary)" }}>…</span>
      )}
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: "var(--novae-bg-main)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", marginTop: 4, overflow: "hidden", maxHeight: 240, overflowY: "auto" }}>
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setQuery(u.username);
                onChange(u.username);
                setResults([]);
                setOpen(false);
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-primary)", cursor: "pointer" }}
            >
              {u.avatar ? (
                <img src={u.avatar} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--novae-bg-tag)", flexShrink: 0 }} />
              )}
              <span>
                @{u.username}
                {u.name && <span style={{ color: "var(--novae-text-secondary)", marginLeft: 6 }}>{u.name}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
