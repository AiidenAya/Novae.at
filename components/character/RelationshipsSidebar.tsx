import Image from "next/image";
import Link from "next/link";
import SectionCard from "./SectionCard";
import type { Character, Relationship } from "@/lib/generated/prisma";

type RelationshipWithCharacters = Relationship & {
  characterA: Pick<Character, "id" | "numId" | "name" | "slug">;
  characterB: Pick<Character, "id" | "numId" | "name" | "slug">;
};

interface RelationshipsSidebarProps {
  characterId: string;
  /** character.relationshipsA + character.relationshipsB */
  relationships: RelationshipWithCharacters[];
}

export default function RelationshipsSidebar({ characterId, relationships }: RelationshipsSidebarProps) {
  if (relationships.length === 0) return null;

  const preview = relationships.slice(0, 2);

  return (
    <SectionCard
      title="Relationships"
      action={
        <Link
          href="?tab=relationships"
          className="font-medium italic underline text-sm"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "var(--novae-text-base)",
            color: "var(--novae-text-link)",
          }}
        >
          View more
        </Link>
      }
    >
      <div className="flex flex-col gap-5 w-full">
        {preview.map((rel) => {
          const other = rel.characterAId === characterId ? rel.characterB : rel.characterA;
          return (
            <div key={rel.id} className="flex gap-3 items-center w-full">
              {/* Avatar placeholder */}
              <div
                className="relative shrink-0 rounded-[var(--novae-radius-md)] overflow-hidden size-[100px]"
                style={{ backgroundColor: "var(--novae-bg-card)" }}
              >
                <div
                  className="w-full h-full flex items-center justify-center text-xs"
                  style={{ color: "var(--novae-text-secondary)" }}
                >
                  {other.name[0]}
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex gap-[10px] items-center w-full">
                  <Link
                    href={`/library/characters/${other.numId}-${other.slug}`}
                    className="font-medium flex-1 min-w-0 truncate"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-lg)",
                      color: "var(--novae-text-primary)",
                    }}
                  >
                    {other.name}
                  </Link>
                  <span
                    className="px-2 py-1 rounded-[var(--novae-radius-sm)] border-[0.5px] whitespace-nowrap shrink-0"
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: "var(--novae-text-xs)",
                      color: "var(--novae-text-tag)",
                      backgroundColor: "var(--novae-bg-tag)",
                      borderColor: "var(--novae-outline-tag)",
                    }}
                  >
                    {rel.type}
                  </span>
                </div>
                {rel.description && (
                  <p
                    className="font-medium line-clamp-2"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-base)",
                      color: "var(--novae-text-secondary)",
                    }}
                  >
                    {rel.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
