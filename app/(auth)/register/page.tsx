"use client";
import RegisterForm from "@/components/auth/RegisterForm";
import { useT } from "@/lib/locale-context";

export default function RegisterPage() {
  const { t } = useT();
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--novae-text-primary)" }}>
            {t.registerPageTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-secondary)" }}>
            {t.registerPageSubtitle}
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
