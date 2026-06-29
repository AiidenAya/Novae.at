"use client";

import { useState } from "react";
import Link from "next/link";
import SectionCard from "./SectionCard";
import SensitiveImageWrapper, { SensitiveBadge } from "@/components/SensitiveImageWrapper";
import type { Artwork } from "@/lib/generated/prisma";

interface LatestImagesCardProps {
  artworks: Artwork[];
  characterId: string;
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 flex items-center justify-center size-10 rounded-full transition-opacity hover:opacity-70"
        style={{ backgroundColor: "var(--novae-bg-card)", color: "var(--novae-text-primary)" }}
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full rounded-[var(--novae-radius-lg)] object-contain"
        style={{ maxHeight: "calc(100vh - 4rem)", boxShadow: "0 0 60px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export default function LatestImagesCard({ artworks, characterId }: LatestImagesCardProps) {
  const [lightbox, setLightbox] = useState<Artwork | null>(null);
  const preview = artworks.slice(0, 4);

  return (
    <>
      <SectionCard
        title="Latest images"
        action={
          <Link
            href="?tab=gallery"
            className="font-medium italic underline"
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
        {preview.length === 0 ? (
          <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>
            No images yet.
          </p>
        ) : (
          <div className="flex gap-2 items-start w-full overflow-hidden">
            {preview.map((artwork) => (
              <div
                key={artwork.id}
                className="relative rounded-[var(--novae-radius-md)] overflow-hidden shrink-0 aspect-square flex-1"
                style={{ backgroundColor: "var(--novae-bg-card)" }}
              >
                <SensitiveImageWrapper sensitiveType={artwork.sensitiveType} className="absolute inset-0">
                  <button
                    onClick={() => setLightbox(artwork)}
                    className="w-full h-full transition-opacity hover:opacity-80 cursor-zoom-in"
                  >
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title ?? "Artwork"}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </SensitiveImageWrapper>
                <SensitiveBadge sensitiveType={artwork.sensitiveType} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {lightbox && (
        <Lightbox
          src={lightbox.imageUrl}
          alt={lightbox.title ?? "Artwork"}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
