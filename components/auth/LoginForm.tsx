"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn.email({ email, password });
    if (result.error) {
      setError(result.error.message ?? "Identifiants incorrects.");
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
        <label htmlFor="email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>Mot de passe</label>
        <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)" }}>
        {loading ? "Connexion…" : "Se connecter"}
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
        Pas encore de compte ?{" "}
        <Link href="/register" className="underline font-medium" style={{ color: "var(--novae-text-link)" }}>S&apos;inscrire</Link>
      </p>
    </form>
  );
}
