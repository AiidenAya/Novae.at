import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parseCharacterParam } from "@/lib/character-url";
import { creditsInclude } from "@/lib/artwork-credits";
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
      folder:  { select: { isPublic: true } },
      world:   { select: { id: true, numId: true, name: true, slug: true, isPublic: true } },
      baseCharacter: {
        select: {
          id: true, name: true, numId: true, slug: true, avatarUrl: true, isPublic: true,
          variants: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, variantLabel: true, isPublic: true }, orderBy: { createdAt: "asc" } },
        },
      },
      variants: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, variantLabel: true, isPublic: true }, orderBy: { createdAt: "asc" } },
      artworks: { orderBy: { createdAt: "desc" }, include: { characters: { select: { id: true, name: true, numId: true, slug: true } }, ...creditsInclude } },
      tags:          { include: { tag: true } },
      colorPalettes: { include: { swatches: { orderBy: { order: "asc" } } } },
      favorites: { select: { id: true, userId: true } },
        relationshipsA: { include: { characterB: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, user: { select: { username: true } } } } } },
        relationshipsB: { include: { characterA: { select: { id: true, name: true, numId: true, slug: true, avatarUrl: true, user: { select: { username: true } } } } } },
        galleries: { include: { images: { orderBy: { order: "asc" }, select: { id: true, artworkId: true, order: true } } }, orderBy: { order: "asc" } },
    },
  });

  if (!character) notFound();

  const isOwner = currentUserId === character.userId;

  const folderHidden = character.folder !== null && !character.folder.isPublic;
  if ((!character.isPublic || folderHidden) && !isOwner) notFound();

  const initialFavorited = !!currentUserId && character.favorites.some((f) => f.userId === currentUserId);

  // hide unaccepted relationships: incoming (B side) only when accepted;
  // outgoing (A side) pending only visible to the owner
  const filteredCharacter = {
    ...character,
    relationshipsA: character.relationshipsA.filter((r) => r.status === "accepted" || isOwner),
    relationshipsB: character.relationshipsB.filter((r) => r.status === "accepted"),
    variants: character.variants.filter((v) => v.isPublic || isOwner),
    baseCharacter: character.baseCharacter && {
      ...character.baseCharacter,
      variants: character.baseCharacter.variants.filter((v) => v.isPublic || isOwner),
    },
    artworks: character.artworks.map((a) => ({
      ...a,
      credits: a.credits.map((c) => ({ id: c.id, userId: c.userId, username: c.user?.username ?? null, label: c.label, url: c.url })),
    })),
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
