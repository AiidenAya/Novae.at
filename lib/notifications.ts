import { prisma } from "@/lib/prisma";

export async function notifyFollowers(
  actorId: string,
  type: "new_character" | "new_artwork",
  opts: { characterId?: string; artworkId?: string },
) {
  const followers = await prisma.follow.findMany({
    where: { followingId: actorId },
    select: { followerId: true },
  });
  if (!followers.length) return;

  await prisma.notification.createMany({
    data: followers.map((f) => ({
      type,
      recipientId: f.followerId,
      actorId,
      characterId: opts.characterId ?? null,
      artworkId:   opts.artworkId   ?? null,
    })),
    skipDuplicates: true,
  });
}

export async function notifyUser(
  recipientId: string,
  actorId: string,
  type: "new_follower" | "new_favorite",
  opts: { characterId?: string } = {},
) {
  await prisma.notification.create({
    data: {
      type,
      recipientId,
      actorId,
      characterId: opts.characterId ?? null,
    },
  });
}
