"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "infos", label: "Infos" },
  { key: "gallery", label: "Galerie" },
  { key: "relationships", label: "Relations" },
  { key: "tags", label: "Tags" },
  { key: "palette", label: "Palette" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface CharacterTabsProps {
  activeTab: TabKey;
  characterId: string;
}

export default function CharacterTabs({ activeTab, characterId }: CharacterTabsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex border-b gap-1">
      {TABS.map(({ key, label }) => (
        <Link
          key={key}
          href={`${pathname}?tab=${key}`}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
