import SectionCard from "./SectionCard";
import type { CharacterTag, Tag } from "@/lib/generated/prisma";

type CharacterTagWithTag = CharacterTag & { tag: Tag };

interface TagsSidebarProps {
  /** character.tags */
  tags: CharacterTagWithTag[];
}

export default function TagsSidebar({ tags }: TagsSidebarProps) {
  if (tags.length === 0) return null;

  return (
    <SectionCard title="Tags">
      <div className="flex flex-wrap gap-2">
        {tags.map(({ tag }) => (
          <span
            key={tag.id}
            className="px-3 py-1 rounded-[var(--novae-radius-sm)] border-[0.5px] text-sm whitespace-nowrap"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "var(--novae-text-base)",
              color: "var(--novae-text-tag)",
              backgroundColor: "var(--novae-bg-tag)",
              borderColor: "var(--novae-outline-tag)",
            }}
          >
            #{tag.name}
          </span>
        ))}
      </div>
    </SectionCard>
  );
}
