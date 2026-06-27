import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseCharacterParam } from "@/lib/character-url";
import CharacterPageClient from "./CharacterPageClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CharacterPage({ params }: Props) {
  const { id: param } = await params;
  const numId = parseCharacterParam(param);
  if (isNaN(numId)) notFound();

  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const currentUserId = session?.user?.id ?? null;

  const character = await prisma.character.findUnique({
    where: { numId },
    include: {
      user:    { select: { username: true } },
      artworks: { orderBy: { createdAt: "desc" }, include: { characters: { select: { id: true, name: true, numId: true, slug: true } } } },
      tags:          { include: { tag: true } },
      colorPalettes: { include: { swatches: { orderBy: { order: "asc" } } } },
      favorites: { select: { id: true, userId: true } },
        relationshipsA: { include: { characterB: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, user: { select: { username: true } } } } } },
        relationshipsB: { include: { characterA: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, user: { select: { username: true } } } } } },
        galleries: { include: { images: { orderBy: { order: "asc" }, select: { id: true, artworkId: true, order: true } } }, orderBy: { name: "asc" } },
    },
  });

  if (!character) notFound();

  const isOwner = currentUserId === character.userId;

  if (!character.isPublic && !isOwner) notFound();

  const initialFavorited = !!currentUserId && character.favorites.some((f) => f.userId === currentUserId);

  // hide unaccepted relationships: incoming (B side) only when accepted;
  // outgoing (A side) pending only visible to the owner
  const filteredCharacter = {
    ...character,
    relationshipsA: character.relationshipsA.filter((r) => r.status === "accepted" || isOwner),
    relationshipsB: character.relationshipsB.filter((r) => r.status === "accepted"),
  };

  return (
    <CharacterPageClient
      character={filteredCharacter}
      isOwner={isOwner}
      currentUserId={currentUserId}
      initialFavorited={initialFavorited}
    />
  );
}
