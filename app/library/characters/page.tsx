import Link from "next/link";

export default function CharactersLibraryPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes personnages</h1>
        <Link
          href="/library/characters/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Nouveau personnage
        </Link>
      </div>
      <p className="text-muted-foreground">Liste des personnages — à implémenter</p>
    </main>
  );
}
