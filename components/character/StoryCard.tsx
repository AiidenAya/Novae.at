import Image from "next/image";
import Link from "next/link";
import SectionCard from "./SectionCard";

export interface StoryEntry {
  id: string;
  title: string;
  excerpt: string;
  date: Date;
  imageUrl?: string | null;
}

interface StoryCardProps {
  /** story entries — model to be created in V2 */
  entries: StoryEntry[];
}

export default function StoryCard({ entries }: StoryCardProps) {
  const preview = entries.slice(0, 1);

  return (
    <SectionCard
      title="Story"
      action={
        entries.length > 1 ? (
          <Link
            href="?tab=story"
            className="font-medium italic underline"
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "var(--novae-text-base)",
              color: "var(--novae-text-link)",
            }}
          >
            View more
          </Link>
        ) : undefined
      }
    >
      {preview.length === 0 ? (
        <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
          No story yet.
        </p>
      ) : (
        preview.map((entry) => (
          <div key={entry.id} className="flex gap-4 items-center w-full">
            <div
              className="relative shrink-0 rounded-[var(--novae-radius-md)] overflow-hidden size-[120px]"
              style={{ backgroundColor: "var(--novae-bg-card)" }}
            >
              {entry.imageUrl && (
                <Image src={entry.imageUrl} alt={entry.title} fill className="object-cover" sizes="120px" />
              )}
            </div>
            <div className="flex flex-col gap-[10px] flex-1 min-w-0">
              <p
                className="font-medium whitespace-nowrap"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "var(--novae-text-lg)",
                  color: "var(--novae-text-link)",
                }}
              >
                {entry.title}
              </p>
              <p
                className="font-medium line-clamp-3"
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "var(--novae-text-base)",
                  color: "var(--novae-text-primary)",
                }}
              >
                {entry.excerpt}
              </p>
              <p
                className="font-normal"
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: "var(--novae-text-base)",
                  color: "var(--novae-text-secondary)",
                }}
              >
                {new Intl.DateTimeFormat("en-GB").format(entry.date)}
              </p>
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
}
