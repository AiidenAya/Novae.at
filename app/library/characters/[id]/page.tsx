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

  const [session, character] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    prisma.character.findUnique({
      where: { numId },
      include: {
        user:    { select: { username: true } },
        artworks: { orderBy: { createdAt: "desc" } },
        tags:          { include: { tag: true } },
        colorPalettes: { include: { swatches: { orderBy: { order: "asc" } } } },
        favorites: true,
      },
    }),
  ]);

  if (!character) notFound();

  const isOwner = session?.user?.id === character.userId;

  if (!character.isPublic && !isOwner) notFound();

  return (
    <CharacterPageClient
      character={character}
      isOwner={isOwner}
      currentUserId={session?.user?.id ?? null}
    />
  );
}
