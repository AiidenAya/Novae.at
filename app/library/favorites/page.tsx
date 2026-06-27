import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FavoritesLibrary from "./FavoritesLibrary";

export default async function FavoritesLibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) redirect("/login");

  const [favorites, folders] = await Promise.all([
    prisma.favorite.findMany({
      where: { userId: session.user.id, characterId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        folderId: true,
        character: {
          select: {
            id: true, numId: true, slug: true, name: true, avatarUrl: true,
            artworks: { orderBy: { createdAt: "desc" }, take: 1, select: { imageUrl: true } },
            user: { select: { username: true } },
          },
        },
      },
    }),
    prisma.favoriteFolder.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const favChars = favorites
    .filter((f) => f.character)
    .map((f) => ({
      id: f.character!.id,
      numId: f.character!.numId,
      slug: f.character!.slug,
      name: f.character!.name,
      avatarUrl: f.character!.avatarUrl,
      cover: f.character!.avatarUrl ?? f.character!.artworks[0]?.imageUrl ?? null,
      username: f.character!.user?.username ?? null,
      folderId: f.folderId,
    }));

  return (
    <main style={{ width: "100%", padding: "40px 24px", fontFamily: "var(--font-dm-sans)" }}>
      <div className="library-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          Favorites
        </h1>
      </div>

      <FavoritesLibrary favorites={favChars} folders={folders} />
    </main>
  );
}
