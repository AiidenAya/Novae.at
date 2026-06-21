"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCharacterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const character = await res.json();
      router.push(`/library/characters/${character.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "var(--novae-text-5xl)",
              fontWeight: 700,
              color: "var(--novae-text-primary)",
              margin: 0,
            }}
          >
            New character
          </h1>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-lg)",
              color: "var(--novae-text-secondary)",
              margin: 0,
            }}
          >
            Start with a name — you can fill in everything else on the character page.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label
            htmlFor="name"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-sm)",
              fontWeight: 600,
              color: "var(--novae-text-secondary)",
            }}
          >
            Character name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Saphira Aishi"
            autoFocus
            style={{
              background: "var(--novae-bg-input)",
              border: "1px solid var(--novae-outline-all)",
              borderRadius: "var(--novae-radius-md)",
              outline: "none",
              color: "var(--novae-text-primary)",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-xl)",
              padding: "14px 18px",
              width: "100%",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--novae-outline-selected)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--novae-outline-all)")}
          />
          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "var(--novae-text-sm)",
                color: "var(--novae-text-error, #e05252)",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              flex: 1,
              padding: "14px 24px",
              background: "var(--novae-btn-secondary)",
              border: "1px solid var(--novae-outline-all)",
              borderRadius: "var(--novae-radius-md)",
              color: "var(--novae-text-btn)",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-lg)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              flex: 2,
              padding: "14px 24px",
              background: name.trim() && !loading ? "var(--novae-btn-primary)" : "var(--novae-bg-card)",
              border: "none",
              borderRadius: "var(--novae-radius-md)",
              color: "var(--novae-text-btn)",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-lg)",
              fontWeight: 600,
              cursor: name.trim() && !loading ? "pointer" : "not-allowed",
              opacity: name.trim() && !loading ? 1 : 0.5,
              transition: "opacity 0.15s, background 0.15s",
            }}
          >
            {loading ? "Creating…" : "Create character →"}
          </button>
        </div>
      </form>
    </div>
  );
}
