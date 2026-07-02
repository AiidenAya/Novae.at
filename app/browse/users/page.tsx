import { prisma } from "@/lib/prisma";
import { BrowseClient } from "../_client";

export const revalidate = 60;

const PAGE_SIZE = 24;

export default async function BrowseUsersPage() {
  const users = await prisma.user.findMany({
    where: { username: { not: null } },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    select: {
      id: true, username: true, name: true, avatar: true,
      _count: { select: { characters: true, artworks: true, followers: true } },
    },
  });

  return (
    <BrowseClient
      type="users"
      initialItems={users.slice(0, PAGE_SIZE)}
      initialHasMore={users.length > PAGE_SIZE}
    />
  );
}
