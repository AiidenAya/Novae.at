// Shared registry of named role icons.
// Roles store an icon *key* (see prisma Role.icon); the back office picks from this
// set and profiles render the matching SVG next to the username.

export type RoleIconKey =
  | "crown"
  | "shield"
  | "star"
  | "palette"
  | "sparkle"
  | "verified"
  | "heart"
  | "bolt"
  | "leaf"
  | "flame";

// Each entry: a human label for the picker + the inner SVG paths (drawn with currentColor).
export const ROLE_ICONS: Record<RoleIconKey, { label: string; paths: React.ReactNode }> = {
  crown: {
    label: "Couronne",
    paths: <path d="M2 4l3 12h14l3-12-6 5-4-5-4 5-6-5z" />,
  },
  shield: {
    label: "Bouclier",
    paths: <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />,
  },
  star: {
    label: "Étoile",
    paths: <path d="M12 2l3 6.5 7 .8-5.2 4.7 1.4 6.9L12 17.6 5.4 20.9l1.4-6.9L1.6 9.3l7-.8L12 2z" />,
  },
  palette: {
    label: "Palette",
    paths: (
      <>
        <path d="M12 2a10 10 0 0 0 0 20c1.7 0 2-1.3 1.2-2.2-.8-.9-.3-2.3 1-2.3H17a5 5 0 0 0 5-5c0-5.5-4.5-10.5-10-10.5z" />
        <circle cx="7.5" cy="10.5" r="1.3" fill="var(--novae-bg-card)" />
        <circle cx="12" cy="7.5" r="1.3" fill="var(--novae-bg-card)" />
        <circle cx="16.5" cy="10.5" r="1.3" fill="var(--novae-bg-card)" />
      </>
    ),
  },
  sparkle: {
    label: "Étincelle",
    paths: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
  },
  verified: {
    label: "Vérifié",
    paths: (
      <>
        <path d="M12 1.5l2.4 1.8 3-.2 1 2.8 2.5 1.6-1 2.9 1 2.9-2.5 1.6-1 2.8-3-.2L12 22.5l-2.4-1.8-3 .2-1-2.8L3.1 16l1-2.9-1-2.9 2.5-1.6 1-2.8 3 .2L12 1.5z" />
        <path d="M8.5 12l2.3 2.3 4.4-4.6" fill="none" stroke="var(--novae-bg-card)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  heart: {
    label: "Cœur",
    paths: <path d="M12 21l-1.4-1.3C5.4 15 2 11.9 2 8.1 2 5.3 4.2 3 7 3c1.7 0 3.3.8 4 2 .7-1.2 2.3-2 4-2 2.8 0 5 2.3 5 5.1 0 3.8-3.4 6.9-8.6 11.6L12 21z" />,
  },
  bolt: {
    label: "Éclair",
    paths: <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
  },
  leaf: {
    label: "Feuille",
    paths: <path d="M4 20c0-9 6-16 16-16 0 10-6 16-16 16zm0 0c2-5 5-8 9-10" fill="currentColor" stroke="none" />,
  },
  flame: {
    label: "Flamme",
    paths: <path d="M12 2c3 4 6 6 6 10a6 6 0 0 1-12 0c0-1.8.7-3.2 1.8-4.4C8.6 9 9 10 9 11c1-1 2-3 1-6 1 1 2 2 2 3z" />,
  },
};

export const ROLE_ICON_KEYS = Object.keys(ROLE_ICONS) as RoleIconKey[];

export function isRoleIconKey(value: unknown): value is RoleIconKey {
  return typeof value === "string" && value in ROLE_ICONS;
}

export function RoleIcon({
  name,
  size = 18,
  title,
  color = "var(--novae-text-tag)",
}: {
  name: string | null | undefined;
  size?: number;
  title?: string;
  color?: string;
}) {
  if (!isRoleIconKey(name)) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke="none"
      role="img"
      aria-label={title ?? name}
    >
      {title ? <title>{title}</title> : null}
      {ROLE_ICONS[name].paths}
    </svg>
  );
}
