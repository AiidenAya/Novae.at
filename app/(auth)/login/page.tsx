import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--novae-text-primary)" }}>
            Connexion
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-dm-sans)", color: "var(--novae-text-secondary)" }}>
            Connecte-toi à ton compte Novae
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
