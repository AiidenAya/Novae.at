"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp, signIn } from "@/lib/auth-client";

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

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (signUp.email as any)({ email, password, name: username, username });
    if (result.error) {
      setError(result.error.message ?? "Une erreur est survenue.");
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
        <label htmlFor="username" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>Nom d&apos;utilisateur</label>
        <input id="username" type="text" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>Mot de passe</label>
        <div className="relative">
          <input id="password" type={showPassword ? "text" : "password"} required autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "42px" }} />
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
        {loading ? "Création…" : "Créer mon compte"}
      </button>

      <div className="relative my-1 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--novae-outline-all)" }} />
        <span className="text-xs uppercase" style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>ou</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--novae-outline-all)" }} />
      </div>

      <button type="button" onClick={() => signIn.social({ provider: "google", callbackURL: "/library/characters" })}
        className="w-full py-3 rounded-[var(--novae-radius-md)] font-medium border transition-opacity hover:opacity-80"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", borderColor: "var(--novae-outline-all)", backgroundColor: "var(--novae-bg-card)", color: "var(--novae-text-primary)" }}>
        Continuer avec Google
      </button>

      <p className="text-center text-sm" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-secondary)" }}>
        Déjà un compte ?{" "}
        <Link href="/login" className="underline font-medium" style={{ color: "var(--novae-text-link)" }}>Se connecter</Link>
      </p>
    </form>
  );
}
