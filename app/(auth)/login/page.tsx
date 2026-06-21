"use client";
import LoginForm from "@/components/auth/LoginForm";
import { useT } from "@/lib/locale-context";

export default function LoginPage() {
  const { t } = useT();
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--novae-text-primary)" }}>
            {t.loginPageTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-secondary)" }}>
            {t.loginPageSubtitle}
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
