import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { creditsInclude } from "@/lib/artwork-credits";
import WorldPageClient from "./WorldPageClient";

interface Props {
  params: Promise<{ worldId: string }>;
}

export default async function WorldPage({ params }: Props) {
  const { worldId } = await params;
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const currentUserId = session?.user?.id ?? null;

  // Parse worldId: either a cuid (legacy) or numId-slug format
  const numIdMatch = worldId.match(/^(\d+)-/);
  const where = numIdMatch
    ? { numId: parseInt(numIdMatch[1], 10) }
    : { id: worldId };

  // Fetch world with related data
  const world = await prisma.world.findUnique({
    where,
    include: {
      creator: { select: { username: true } },
      baseWorld: {
        select: {
          id: true, name: true, numId: true, slug: true, avatarUrl: true, isPublic: true,
          variants: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, variantLabel: true, isPublic: true }, orderBy: { createdAt: "asc" } },
        },
      },
      variants: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, variantLabel: true, isPublic: true }, orderBy: { createdAt: "asc" } },
      locations: { select: { id: true, name: true, description: true, x: true, y: true } },
      characters: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, user: { select: { username: true } } } },
      maps: { select: { id: true, name: true, imageUrl: true, bounds: true } },
      artworks: { orderBy: { createdAt: "desc" }, include: { worlds: { select: { id: true, name: true, numId: true, slug: true } }, ...creditsInclude } },
      tags: { include: { tag: true } },
      colorPalettes: { include: { swatches: { orderBy: { order: "asc" } } } },
      favorites: { select: { id: true, userId: true } },
      galleries: { include: { images: { orderBy: { order: "asc" }, select: { id: true, artworkId: true, order: true } } }, orderBy: { order: "asc" } },
    },
  });

  if (!world) notFound();

  // Check access permissions
  const isOwner = currentUserId === world.creatorId;
  if (!world.isPublic && !isOwner) notFound();

  const initialFavorited = !!currentUserId && world.favorites.some((f) => f.userId === currentUserId);

  // Hide non-public variants from non-owners
  const filteredWorld = {
    ...world,
    variants: world.variants.filter((v) => v.isPublic || isOwner),
    baseWorld: world.baseWorld && {
      ...world.baseWorld,
      variants: world.baseWorld.variants.filter((v) => v.isPublic || isOwner),
    },
    artworks: world.artworks.map((a) => ({
      ...a,
      credits: a.credits.map((c) => ({ id: c.id, userId: c.userId, username: c.user?.username ?? null, label: c.label, url: c.url })),
    })),
  };

  return (
    <WorldPageClient
      world={filteredWorld}
      isOwner={isOwner}
      currentUserId={currentUserId}
      initialFavorited={initialFavorited}
    />
  );
}