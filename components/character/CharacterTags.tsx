import type { CharacterTag, Tag } from "@/lib/generated/prisma";

type CharacterTagWithTag = CharacterTag & { tag: Tag };

interface CharacterTagsProps {
  tags: CharacterTagWithTag[];
}

export default function CharacterTagsPanel({ tags }: CharacterTagsProps) {
  if (tags.length === 0) {
    return <p className="text-muted-foreground italic">Aucun tag.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <span
          key={tag.id}
          className="bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
