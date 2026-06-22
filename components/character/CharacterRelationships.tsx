import Link from "next/link";
import type { Character, Relationship } from "@/lib/generated/prisma";

type RelationshipWithCharacters = Relationship & {
  characterA: Pick<Character, "id" | "numId" | "name" | "slug">;
  characterB: Pick<Character, "id" | "numId" | "name" | "slug">;
};

interface CharacterRelationshipsProps {
  characterId: string;
  relationships: RelationshipWithCharacters[];
}

export default function CharacterRelationships({
  characterId,
  relationships,
}: CharacterRelationshipsProps) {
  if (relationships.length === 0) {
    return <p className="text-muted-foreground italic">Aucune relation définie.</p>;
  }

  return (
    <ul className="space-y-3">
      {relationships.map((rel) => {
        const other = rel.characterAId === characterId ? rel.characterB : rel.characterA;
        return (
          <li key={rel.id} className="flex items-start gap-3 p-3 rounded-md border">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link
                  href={`/library/characters/${other.numId}-${other.slug}`}
                  className="font-medium hover:underline"
                >
                  {other.name}
                </Link>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  {rel.type}
                </span>
              </div>
              {rel.description && (
                <p className="mt-1 text-sm text-muted-foreground">{rel.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
