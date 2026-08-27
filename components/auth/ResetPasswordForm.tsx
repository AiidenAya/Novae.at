"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/auth-client";
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

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { t } = useT();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="px-4 py-3 rounded-[var(--novae-radius-md)] text-sm"
          style={{ backgroundColor: "rgba(220,53,69,0.15)", color: "#ff6b7a", fontFamily: "var(--font-dm-sans)" }}>
          {t.resetPasswordInvalidToken}
        </p>
        <Link href="/forgot-password" className="text-center underline font-medium text-sm" style={{ color: "var(--novae-text-link)" }}>
          {t.forgotPasswordBackToLogin}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t.resetPasswordMismatch);
      return;
    }

    setLoading(true);
    const result = await resetPassword({ newPassword, token: token! });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? t.resetPasswordError);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <p className="px-4 py-3 rounded-[var(--novae-radius-md)] text-sm"
          style={{ backgroundColor: "rgba(40,167,69,0.15)", color: "#4ade80", fontFamily: "var(--font-dm-sans)" }}>
          {t.resetPasswordSuccess}
        </p>
        <Link href="/login" className="text-center underline font-medium text-sm" style={{ color: "var(--novae-text-link)" }}>
          {t.resetPasswordGoToLogin}
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
        <label htmlFor="newPassword" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{t.resetPasswordNewLabel}</label>
        <input id="newPassword" type="password" required autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", color: "var(--novae-text-primary)", fontWeight: 500 }}>{t.resetPasswordConfirmLabel}</label>
        <input id="confirmPassword" type="password" required autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-[var(--novae-radius-md)] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", backgroundColor: "var(--novae-btn-primary)", color: "var(--novae-text-btn)" }}>
        {loading ? t.resetPasswordSubmitting : t.resetPasswordSubmit}
      </button>
    </form>
  );
}
