import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CharacterTabs from "@/components/character/CharacterTabs";
import CharacterInfos from "@/components/character/CharacterInfos";
import CharacterGallery from "@/components/character/CharacterGallery";
import CharacterRelationships from "@/components/character/CharacterRelationships";
import CharacterTagsPanel from "@/components/character/CharacterTags";
import CharacterColorPalette from "@/components/character/CharacterColorPalette";

const VALID_TABS = ["infos", "gallery", "relationships", "tags", "palette"] as const;
type TabKey = (typeof VALID_TABS)[number];

function isValidTab(value: string | undefined): value is TabKey {
  return VALID_TABS.includes(value as TabKey);
}

interface CharacterPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CharacterPage({ params, searchParams }: CharacterPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = isValidTab(tab) ? tab : "infos";

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      user: { select: { username: true } },
      species: { select: { name: true } },
      artworks: true,
      galleries: {
        include: {
          images: {
            include: { artwork: true },
            orderBy: { order: "asc" },
          },
        },
      },
      tags: { include: { tag: true } },
      colorPalettes: {
        include: {
          swatches: { orderBy: { order: "asc" } },
        },
      },
      relationshipsA: {
        include: {
          characterA: { select: { id: true, name: true, slug: true } },
          characterB: { select: { id: true, name: true, slug: true } },
        },
      },
      relationshipsB: {
        include: {
          characterA: { select: { id: true, name: true, slug: true } },
          characterB: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });

  if (!character) notFound();

  const allRelationships = [...character.relationshipsA, ...character.relationshipsB];

  return (
    <main className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{character.name}</h1>
        <p className="text-muted-foreground mt-1">@{character.user.username}</p>
      </div>

      <Suspense>
        <CharacterTabs activeTab={activeTab} characterId={id} />
      </Suspense>

      <section className="pt-2">
        {activeTab === "infos" && <CharacterInfos character={character} />}
        {activeTab === "gallery" && (
          <CharacterGallery galleries={character.galleries} artworks={character.artworks} />
        )}
        {activeTab === "relationships" && (
          <CharacterRelationships characterId={id} relationships={allRelationships} />
        )}
        {activeTab === "tags" && <CharacterTagsPanel tags={character.tags} />}
        {activeTab === "palette" && <CharacterColorPalette palettes={character.colorPalettes} />}
      </section>
    </main>
  );
}
