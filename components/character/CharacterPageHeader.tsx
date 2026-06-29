import React from "react";
import Image from "next/image";
import Link from "next/link";

type IconProps = { className?: string; style?: React.CSSProperties };

// Inline SVG icons — color inherited via currentColor
function IconBook({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.75 2.625C1.75 2.14175 2.14175 1.75 2.625 1.75H5.25C5.73325 1.75 6.125 2.14175 6.125 2.625V11.375C6.125 11.8582 5.73325 12.25 5.25 12.25H2.625C2.14175 12.25 1.75 11.8582 1.75 11.375V2.625Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.875 2.625C7.875 2.14175 8.26675 1.75 8.75 1.75H11.375C11.8582 1.75 12.25 2.14175 12.25 2.625V11.375C12.25 11.8582 11.8582 12.25 11.375 12.25H8.75C8.26675 12.25 7.875 11.8582 7.875 11.375V2.625Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconUser({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 12C2.5 9.51472 4.51472 7.5 7 7.5C9.48528 7.5 11.5 9.51472 11.5 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconPencilSm({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconCalendar({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.75" y="2.625" width="10.5" height="9.625" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1.75 5.25H12.25" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4.375 1.75V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M9.625 1.75V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconImage({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="6.75" cy="6.75" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M2.25 12L6 8.25L9 11.25L11.25 9L15.75 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPencil({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 2.5L15.5 5.5L6.5 14.5H3.5V11.5L12.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconSun({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M24 4V8M24 40V44M4 24H8M40 24H44M8.686 8.686L11.515 11.515M36.485 36.485L39.314 39.314M39.314 8.686L36.485 11.515M11.515 36.485L8.686 39.314" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

interface MetaItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}

interface CharacterPageHeaderProps {
  /** character.name */
  name: string;
  /** character.description — displayed as quote */
  quote: string | null;
  /** character.imageUrl — main reference image (coming soon) */
  imageUrl: string | null;
  /** character.user.username */
  ownerUsername: string;
  /** character.species?.name — placeholder universe */
  universe: string | null;
  /** character.createdAt */
  createdAt: Date;
  /** Whether the current user owns this character */
  isOwner?: boolean;
  characterId: string;
  characterNumId: number;
  characterSlug: string;
}

export default function CharacterPageHeader({
  name,
  quote,
  imageUrl,
  ownerUsername,
  universe,
  createdAt,
  isOwner = false,
  characterId,
  characterNumId,
  characterSlug,
}: CharacterPageHeaderProps) {
  const metaItems: MetaItem[] = [
    {
      icon: <IconBook className="shrink-0" style={{ color: "var(--novae-text-secondary)" }} />,
      label: "Universe",
      value: universe ?? "—",
    },
    {
      icon: <IconUser className="shrink-0" style={{ color: "var(--novae-text-secondary)" }} />,
      label: "Owner",
      value: `@${ownerUsername}`,
      href: `/${ownerUsername}`,
    },
    {
      icon: <IconPencilSm className="shrink-0" style={{ color: "var(--novae-text-secondary)" }} />,
      label: "Designer",
      value: `@${ownerUsername}`,
      href: `/${ownerUsername}`,
    },
    {
      icon: <IconCalendar className="shrink-0" style={{ color: "var(--novae-text-secondary)" }} />,
      label: "Created the",
      value: new Intl.DateTimeFormat("en-GB").format(createdAt),
    },
  ];

  return (
    <div className="flex items-center justify-between gap-4 lg:gap-6 w-full">
      {/* Main image */}
      <div
        className="char-header-avatar relative shrink-0 rounded-[var(--novae-radius-lg)] overflow-hidden size-[220px] md:size-[280px] lg:size-[360px]"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm"
            style={{ backgroundColor: "var(--novae-bg-card)", color: "var(--novae-text-secondary)" }}
          >
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="char-header-meta flex flex-col flex-1 min-w-0 min-h-[220px] md:min-h-[280px] lg:min-h-[350px] items-end justify-between pl-3 lg:pl-6 pr-2 lg:pr-4 py-2">
        {/* Edit buttons — owner only */}
        {isOwner && (
          <div className="flex gap-[10px] items-center shrink-0">
            <button
              className="flex gap-2 items-center px-5 py-3 rounded-[var(--novae-radius-md)] border text-sm font-medium"
              style={{
                fontFamily: "var(--font-dm-sans)",
                backgroundColor: "var(--novae-btn-secondary)",
                borderColor: "var(--novae-outline-all)",
                color: "var(--novae-text-btn)",
                fontSize: "var(--novae-text-lg)",
              }}
            >
              <IconImage className="size-[18px]" style={{ color: "var(--novae-text-btn)" }} />
              Add image
            </button>
            <Link
              href={`/library/characters/${characterNumId}-${characterSlug}/edit`}
              className="flex gap-2 items-center px-5 py-3 rounded-[var(--novae-radius-md)] text-sm font-medium"
              style={{
                fontFamily: "var(--font-dm-sans)",
                backgroundColor: "var(--novae-btn-primary)",
                color: "var(--novae-text-btn)",
                fontSize: "var(--novae-text-lg)",
              }}
            >
              <IconPencil className="size-[18px]" style={{ color: "var(--novae-text-btn)" }} />
              Edit
            </Link>
          </div>
        )}

        {/* Bio */}
        <div className="flex flex-col gap-3 w-full">
          {/* Name + icon */}
          <div className="flex gap-4 items-center">
            <h1
              className="font-bold text-2xl md:text-4xl lg:text-5xl truncate"
              style={{
                fontFamily: "var(--font-space-grotesk)",
                color: "var(--novae-text-primary)",
              }}
            >
              {name}
            </h1>
            <IconSun className="size-6 md:size-8 lg:size-12 shrink-0" style={{ color: "var(--novae-btn-primary)" }} />
          </div>

          {/* Quote */}
          {quote && (
            <p
              className="font-light italic text-sm md:text-lg lg:text-2xl line-clamp-2"
              style={{
                fontFamily: "var(--font-dm-sans)",
                color: "var(--novae-text-secondary)",
              }}
            >
              &ldquo;{quote}&rdquo;
            </p>
          )}

          {/* Meta row */}
          <div
            className="flex flex-wrap gap-4 lg:gap-8 items-center pt-3 lg:pt-4"
            style={{ borderTop: "1px solid var(--novae-outline-all)" }}
          >
            {metaItems.map(({ icon, label, value, href }) => (
              <div key={label} className="flex flex-col gap-1 items-start">
                <div className="flex gap-2 items-center">
                  {icon}
                  <span
                    className="font-medium"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-base)",
                      color: "var(--novae-text-primary)",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {href ? (
                  <Link
                    href={href}
                    className="font-bold italic underline"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-base)",
                      color: "var(--novae-text-link)",
                    }}
                  >
                    {value}
                  </Link>
                ) : (
                  <span
                    className="font-bold italic"
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "var(--novae-text-base)",
                      color: "var(--novae-text-link)",
                    }}
                  >
                    {value}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
