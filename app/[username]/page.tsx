interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">@{username}</h1>
      <p className="text-muted-foreground">Profil public — à implémenter</p>
    </main>
  );
}
