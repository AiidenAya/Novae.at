"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { useT } from "@/lib/locale-context";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "var(--novae-radius-md)",
  border: "1px solid var(--novae-outline-all)",
  backgroundColor: "var(--novae-bg-card)",
  color: "var(--novae-text-primary)",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "var(--novae-text-base)",
  padding: "10px 14px",
  outline: "none",
};

export default function LoginForm() {
  const router = useRouter();
  const { t } = useT();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let email = identifier;
    if (!identifier.includes("@")) {
      try {
        const res = await fetch("/api/resolve-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: identifier }),
        });
        const data = await res.json();
        if (!data.email) {
          setError(t.loginUsernameNotFound);
          setLoading(false);
          return;
        }
        email = data.email;
      } catch {
        setError(t.loginServerError);
        setLoading(false);
        return;
      }
    }

    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? t.loginServerError);
      setLoading(false);
      return;
    }
    router.push("/library/characters");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="px-4 py-3 rounded-[var(--novae-radius-md)] text-sm"
          style={{ backgroundColor: "rgba(220,53,69,0.15)", color: "#ff6b7a", fontFamily: "var(--font-dm-sans)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="identifier" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{t.loginEmailLabel}</label>
        <input id="identifier" type="text" required autoComplete="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{t.loginPasswordLabel}</label>
        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "42px" }} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--novae-text-secondary)", padding: 0, display: "flex", alignItems: "center" }}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)" }}>
        {loading ? t.loginSubmitting : t.loginSubmit}
      </button>

      <p className="text-center text-sm" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-secondary)" }}>
        {t.loginNoAccount}{" "}
        <Link href="/register" className="underline font-medium" style={{ color: "var(--novae-text-link)" }}>{t.loginSignUp}</Link>
      </p>
    </form>
  );
}
