import SectionCard from "./SectionCard";

interface StatItem {
  value: number;
  label: string;
}

interface StatsSidebarProps {
  /** character._count.artworks */
  images: number;
  /** character.relationshipsA.length + character.relationshipsB.length */
  relations: number;
  /** character.favorites.length */
  favorites: number;
  /** story entries count — à venir */
  entries: number;
}

export default function StatsSidebar({ images, relations, favorites, entries }: StatsSidebarProps) {
  const stats: StatItem[] = [
    { value: images,    label: "images" },
    { value: relations, label: "relations" },
    { value: favorites, label: "favorites" },
    { value: entries,   label: "entries" },
  ];

  return (
    <SectionCard title="Statistics">
      <div className="grid grid-cols-2 gap-4 w-full">
        {stats.map(({ value, label }) => (
          <div key={label} className="flex flex-col gap-1 items-center">
            <span
              className="font-bold text-center"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "var(--novae-text-3xl)",
                color: "var(--novae-text-primary)",
              }}
            >
              {value}
            </span>
            <span
              className="font-medium"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "var(--novae-text-base)",
                color: "var(--novae-text-secondary)",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
