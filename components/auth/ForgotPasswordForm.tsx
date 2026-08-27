"use client";

import { useState } from "react";
import Link from "next/link";
import { forgetPassword } from "@/lib/auth-client";
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

export default function ForgotPasswordForm() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await forgetPassword({ email, redirectTo: "/reset-password" });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? t.forgotPasswordError);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="px-4 py-3 rounded-[var(--novae-radius-md)] text-sm"
          style={{ backgroundColor: "rgba(40,167,69,0.15)", color: "#4ade80", fontFamily: "var(--font-dm-sans)" }}>
          {t.forgotPasswordSuccess}
        </p>
        <Link href="/login" className="text-center underline font-medium text-sm" style={{ color: "var(--novae-text-link)" }}>
          {t.forgotPasswordBackToLogin}
        </Link>
      </div>
    );
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
        <label htmlFor="email" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{t.forgotPasswordEmailLabel}</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)" }}>
        {loading ? t.forgotPasswordSubmitting : t.forgotPasswordSubmit}
      </button>

      <Link href="/login" className="text-center underline font-medium text-sm" style={{ color: "var(--novae-text-link)" }}>
        {t.forgotPasswordBackToLogin}
      </Link>
    </form>
  );
}
