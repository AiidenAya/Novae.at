import type { Character, Species, User } from "@/lib/generated/prisma";

interface CharacterInfosProps {
  character: Character & {
    user: Pick<User, "username">;
    species: Pick<Species, "name"> | null;
  };
}

export default function CharacterInfos({ character }: CharacterInfosProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Description</h2>
        {character.description ? (
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{character.description}</p>
        ) : (
          <p className="mt-2 text-muted-foreground italic">No description.</p>
        )}
      </div>

      {character.species && (
        <div>
          <h2 className="text-lg font-semibold">Species</h2>
          <p className="mt-1 text-muted-foreground">{character.species.name}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Creator</h2>
        <p className="mt-1 text-muted-foreground">@{character.user.username}</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold">Created on</h2>
        <p className="mt-1 text-muted-foreground">
          {new Intl.DateTimeFormat("en-GB", { dateStyle: "long" }).format(
            new Date(character.createdAt)
          )}
        </p>
      </div>
    </section>
  );
}
