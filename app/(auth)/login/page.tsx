import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Connexion</h1>
          <p className="text-muted-foreground mt-1 text-sm">Connecte-toi à ton compte Novae</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
