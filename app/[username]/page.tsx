import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./_profile-client";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const [sessionResult, user] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        role: true,
        _count: { select: { followers: true, artworks: true } },
        characters: {
          where: { isPublic: true },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            folderId: true,
            _count: { select: { artworks: true, favorites: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        characterFolders: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  const isOwner = !!(sessionResult?.user) && sessionResult.user.id === user?.id;

  const dbStats = user
    ? { followers: user._count.followers, artworks: user._count.artworks, characters: user.characters.length }
    : null;

  const dbCharacters = (user?.characters ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    hearts: c._count.favorites,
    images: c._count.artworks,
    coverImage: c.avatarUrl ?? null,
    folderId: c.folderId ?? null,
  }));

  const dbFolders = (user?.characterFolders ?? []).map((f) => ({ id: f.id, name: f.name }));

  return (
    <ProfileClient
      username={username}
      dbStats={dbStats}
      dbCharacters={dbCharacters}
      dbFolders={dbFolders}
      isOwner={isOwner}
      isAdmin={user?.role === "admin"}
    />
  );
}
