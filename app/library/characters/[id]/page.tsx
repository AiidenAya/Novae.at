import { notFound } from "next/navigation";
import { Suspense } from "react";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import CharacterPageHeader  from "@/components/character/CharacterPageHeader";
import CharacterMenuTabs    from "@/components/character/CharacterMenuTabs";
import StatsSidebar         from "@/components/character/StatsSidebar";
import TagsSidebar          from "@/components/character/TagsSidebar";
import RelationshipsSidebar from "@/components/character/RelationshipsSidebar";
import InfoCard             from "@/components/character/InfoCard";
import LatestImagesCard     from "@/components/character/LatestImagesCard";
import ColorPaletteCard     from "@/components/character/ColorPaletteCard";
import VoiceClaimCard       from "@/components/character/VoiceClaimCard";
import StoryCard            from "@/components/character/StoryCard";
import MusicCard            from "@/components/character/MusicCard";

const VALID_TABS = ["profile", "story", "relationships", "gallery", "timeline"] as const;
type TabKey = (typeof VALID_TABS)[number];

function isValidTab(value: string | undefined): value is TabKey {
  return VALID_TABS.includes(value as TabKey);
}

interface CharacterPageProps {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function CharacterPage({ params, searchParams }: CharacterPageProps) {
  const { id }  = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = isValidTab(tab) ? tab : "profile";

  const [session, character] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    prisma.character.findUnique({
    where: { id },
    include: {
      user:    { select: { username: true } },
      species: { select: { name: true } },
      artworks: { orderBy: { createdAt: "desc" } },
      galleries: {
        include: { images: { include: { artwork: true }, orderBy: { order: "asc" } } },
      },
      tags:          { include: { tag: true } },
      colorPalettes: { include: { swatches: { orderBy: { order: "asc" } } } },
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
      favorites: true,
    },
  }),
  ]);

  if (!character) notFound();

  const isOwner = session?.user?.id === character.userId;

  const allRelationships = [...character.relationshipsA, ...character.relationshipsB];

  const DEMO_STORY = [
    {
      id: "demo-story-1",
      title: "Saphira's Final Stand",
      excerpt: "As darkness looms over Eldoria, Saphira gathers the bravest warriors to confront an ancient evil threatening to consume the land. This epic conclusion showcases her growth from a fledgling dragon to a powerful leader, willing to sacrifice everything for her people.",
      date: new Date("2027-11-30"),
      imageUrl: character.artworks[0]?.imageUrl ?? null,
    },
  ];

  const DEMO_MUSIC = [
    {
      id: "demo-music-1",
      title: "we fell in love in october",
      artist: "girl in red",
      url: null,
      thumbnailUrl: character.artworks[1]?.imageUrl ?? null,
    },
    {
      id: "demo-music-2",
      title: "Lover Girl",
      artist: "Laufey",
      url: null,
      thumbnailUrl: character.artworks[2]?.imageUrl ?? null,
    },
  ];

  const infoRows = [
    { label: "Birthdate", value: null },
    { label: "Age",       value: null },
    { label: "Height",    value: null },
    { label: "Weight",    value: null },
    { label: "MBTI",      value: null },
    { label: "Species",   value: character.species?.name ?? null },
  ];

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: "var(--novae-bg-main)" }}
    >
      {/* Background blurred — character.backgroundImageUrl */}
      {character.backgroundImageUrl && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.18 }}>
          <img
            src={character.backgroundImageUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "blur(10px)", transform: "scale(1.05)" }}
          />
        </div>
      )}

      {/* Main content — 3/4 + 1/4 */}
      <div className="relative flex gap-6 px-8 pt-8 w-full items-start">
        {/* Left column 3/4 — scrolls with page */}
        <div className="flex flex-col gap-8 min-w-0 pb-8" style={{ flex: "3 1 0" }}>
          <CharacterPageHeader
            name={character.name}
            quote={character.description}
            imageUrl={character.artworks[2]?.imageUrl ?? null}
            ownerUsername={character.user.username ?? ""}
            universe={character.species?.name ?? null}
            createdAt={character.createdAt}
            isOwner={isOwner}
            characterId={id}
          />

          <Suspense>
            <CharacterMenuTabs activeTab={activeTab} />
          </Suspense>

          {/* Tab content */}
          {activeTab === "profile" && (
            <div className="flex gap-8 items-start w-full">
              {/* Left sidebar of profile tab */}
              <div className="flex flex-col gap-8 w-[434px] shrink-0">
                <InfoCard rows={infoRows} />
                <VoiceClaimCard videoUrl={null} />
                <ColorPaletteCard palettes={character.colorPalettes} />
              </div>

              {/* Main content of profile tab */}
              <div className="flex flex-col gap-8 flex-1 min-w-0">
                <LatestImagesCard artworks={character.artworks} characterId={id} />
                <StoryCard entries={DEMO_STORY} />
                <MusicCard tracks={DEMO_MUSIC} />

                {/* Add container — owner only */}
                {isOwner && (
                  <button
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-[var(--novae-radius-md)] border border-dashed transition-opacity hover:opacity-70"
                    style={{
                      borderColor: "var(--novae-outline-all)",
                      color: "var(--novae-text-secondary)",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-base)",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add a container
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="grid grid-cols-4 gap-3">
              {character.artworks.map((artwork) => (
                <div
                  key={artwork.id}
                  className="relative aspect-square rounded-[var(--novae-radius-md)] overflow-hidden"
                  style={{ backgroundColor: "var(--novae-bg-card)" }}
                >
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title ?? ""}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {character.artworks.length === 0 && (
                <p className="col-span-4" style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
                  No artworks yet.
                </p>
              )}
            </div>
          )}

          {activeTab === "relationships" && (
            <div className="grid grid-cols-2 gap-4">
              {allRelationships.map((rel) => {
                const other = rel.characterAId === id ? rel.characterB : rel.characterA;
                return (
                  <div
                    key={rel.id}
                    className="flex gap-3 items-center p-4 rounded-[var(--novae-radius-md)] border"
                    style={{ backgroundColor: "var(--novae-bg-card)", borderColor: "var(--novae-outline-all)" }}
                  >
                    <span
                      className="font-medium"
                      style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-primary)" }}
                    >
                      {other.name}
                    </span>
                    <span
                      className="px-2 py-1 rounded-[var(--novae-radius-sm)] border-[0.5px] text-xs"
                      style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--novae-text-tag)", backgroundColor: "var(--novae-bg-tag)", borderColor: "var(--novae-outline-tag)" }}
                    >
                      {rel.type}
                    </span>
                  </div>
                );
              })}
              {allRelationships.length === 0 && (
                <p className="col-span-2" style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
                  No relationships yet.
                </p>
              )}
            </div>
          )}

          {activeTab === "story" && (
            <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
              Story — à implémenter en V2.
            </p>
          )}

          {activeTab === "timeline" && (
            <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
              Timeline — à implémenter en V2.
            </p>
          )}
        </div>

        {/* Right sidebar 1/4 — sticky sous la navbar */}
        <aside
          className="flex flex-col gap-6 shrink-0 pb-8 overflow-y-auto"
          style={{
            flex: "1 1 0",
            position: "sticky",
            top: "calc(72px + 2rem)",
            maxHeight: "calc(100vh - 72px - 2rem)",
          }}
        >
          <StatsSidebar
            images={character.artworks.length}
            relations={allRelationships.length}
            favorites={character.favorites.length}
            entries={0}
          />
          <TagsSidebar tags={character.tags} />
          <RelationshipsSidebar characterId={id} relationships={allRelationships} />
        </aside>
      </div>
    </div>
  );
}
