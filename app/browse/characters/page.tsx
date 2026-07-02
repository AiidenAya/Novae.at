import { prisma } from "@/lib/prisma";
import { BrowseClient } from "../_client";

export const revalidate = 60;

const PAGE_SIZE = 24;

export default async function BrowseCharactersPage() {
  const chars = await prisma.character.findMany({
    where: { isPublic: true, OR: [{ folderId: null }, { folder: { isPublic: true } }] },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true, numId: true, slug: true, name: true, avatarUrl: true,
      _count: { select: { artworks: true, favorites: true } },
      user: { select: { username: true, name: true } },
    },
  });

  return (
    <BrowseClient
      type="characters"
      initialItems={chars.slice(0, PAGE_SIZE)}
      initialHasMore={chars.length > PAGE_SIZE}
    />
  );
}
