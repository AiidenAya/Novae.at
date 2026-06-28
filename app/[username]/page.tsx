import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./_profile-client";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username: rawUsername } = await params;
  const username = rawUsername.toLowerCase();

  const [sessionResult, user] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        roles: true,
        name: true,
        bio: true,
        avatar: true,
        coverImage: true,
        pronouns: true,
        socials: true,
        featuredCharacterIds: true,
        featuredFriendUsernames: true,
        _count: { select: { followers: true, artworks: true } },
        characters: {
          where: { isPublic: true },
          select: {
            id: true,
            numId: true,
            slug: true,
            name: true,
            avatarUrl: true,
            folderId: true,
            _count: { select: { artworks: true, favorites: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        characterFolders: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          select: { id: true, name: true, isPublic: true },
        },
        artworks: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            imageUrl: true,
            thumbnailUrl: true,
            title: true,
            characters: { select: { id: true, numId: true, slug: true, name: true } },
          },
        },
      },
    }),
  ]);

  const currentUserId = sessionResult?.user?.id ?? null;
  const isOwner = !!currentUserId && currentUserId === user?.id;

  const isFollowing = !isOwner && !!currentUserId && !!user
    ? !!(await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
      }))
    : false;

  const roleBadges = user?.roles.length
    ? await prisma.role.findMany({
        where: { name: { in: user.roles }, icon: { not: null } },
        select: { name: true, icon: true, description: true },
      }).then((rows) =>
        user.roles
          .map((name) => rows.find((r) => r.name === name))
          .filter((r): r is NonNullable<typeof r> => !!r)
          .map((r) => ({ name: r.name, icon: r.icon!, description: r.description }))
      )
    : [];

  const dbStats = user
    ? { followers: user._count.followers, artworks: user._count.artworks, characters: user.characters.length, worlds: 0 }
    : null;

  // When not the owner, filter out hidden folders and characters inside them
  const visibleFolderIds = new Set(
    (user?.characterFolders ?? [])
      .filter((f) => isOwner || f.isPublic)
      .map((f) => f.id)
  );
  const hiddenFolderIds = new Set(
    (user?.characterFolders ?? [])
      .filter((f) => !isOwner && !f.isPublic)
      .map((f) => f.id)
  );

  const dbCharacters = (user?.characters ?? [])
    .filter((c) => !c.folderId || !hiddenFolderIds.has(c.folderId))
    .map((c) => ({
      id: c.id,
      numId: c.numId,
      slug: c.slug,
      name: c.name,
      hearts: c._count.favorites,
      images: c._count.artworks,
      coverImage: c.avatarUrl ?? null,
      folderId: c.folderId && visibleFolderIds.has(c.folderId) ? c.folderId : null,
    }));

  const dbFolders = (user?.characterFolders ?? [])
    .filter((f) => isOwner || f.isPublic)
    .map((f) => ({ id: f.id, name: f.name }));

  const featuredFriends = user?.featuredFriendUsernames?.length
    ? await prisma.user.findMany({
        where: { username: { in: user.featuredFriendUsernames } },
        select: { username: true, name: true, avatar: true },
      }).then((rows) =>
        user.featuredFriendUsernames
          .map((u) => rows.find((r) => r.username === u))
          .filter(Boolean)
          .map((r) => ({ username: r!.username!, avatar: r!.avatar ?? null }))
      )
    : [];

  const dbProfile = user
    ? {
        name:       user.name       ?? null,
        bio:        user.bio        ?? null,
        avatar:     user.avatar     ?? null,
        coverImage: user.coverImage ?? null,
        pronouns:   user.pronouns   ?? null,
        socials:    (user.socials as Record<string, string> | null) ?? null,
      }
    : null;

  const dbArtworks = (user?.artworks ?? []).map((a) => ({
    id: a.id,
    imageUrl: a.imageUrl,
    thumbnailUrl: a.thumbnailUrl ?? null,
    title: a.title ?? null,
    characters: a.characters.map((c) => ({ id: c.id, numId: c.numId, slug: c.slug, name: c.name })),
  }));

  return (
    <ProfileClient
      username={username}
      dbProfile={dbProfile}
      dbStats={dbStats}
      dbCharacters={dbCharacters}
      dbFolders={dbFolders}
      dbArtworks={dbArtworks}
      featuredCharacterIds={user?.featuredCharacterIds ?? []}
      featuredFriends={featuredFriends}
      isOwner={isOwner}
      isAdmin={user?.roles.includes("admin") ?? false}
      roleBadges={roleBadges}
      initialIsFollowing={isFollowing}
      profileUsername={username}
    />
  );
}
