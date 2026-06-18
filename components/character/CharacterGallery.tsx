import Image from "next/image";
import type { Artwork, Gallery, GalleryImage } from "@/lib/generated/prisma";

type GalleryWithImages = Gallery & {
  images: (GalleryImage & { artwork: Artwork })[];
};

interface CharacterGalleryProps {
  galleries: GalleryWithImages[];
  artworks: Artwork[];
}

export default function CharacterGallery({ galleries, artworks }: CharacterGalleryProps) {
  if (artworks.length === 0 && galleries.length === 0) {
    return <p className="text-muted-foreground italic">Aucune image pour l&apos;instant.</p>;
  }

  return (
    <div className="space-y-8">
      {galleries.map((gallery) => (
        <section key={gallery.id}>
          <h2 className="text-lg font-semibold mb-3">{gallery.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.images
              .sort((a, b) => a.order - b.order)
              .map(({ artwork }) => (
                <div key={artwork.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title ?? "Artwork"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                </div>
              ))}
          </div>
        </section>
      ))}

      {artworks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Tous les artworks</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {artworks.map((artwork) => (
              <div key={artwork.id} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title ?? "Artwork"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
