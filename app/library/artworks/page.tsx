import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ArtworksGrid from "./ArtworksGrid";

export default async function ArtworksLibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const artworks = await prisma.artwork.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      imageUrl: true,
      title: true,
      characters: { select: { numId: true, slug: true, name: true } },
    },
  });

  return (
    <div style={{ padding: "48px 32px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-5xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
            Artworks
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)", margin: 0 }}>
            {artworks.length} image{artworks.length !== 1 ? "s" : ""}
          </p>
        </div>

        <ArtworksGrid artworks={artworks.map((a) => ({
          id: a.id,
          title: a.title ?? "",
          image: a.imageUrl,
          hearts: 0,
          characters: a.characters,
        }))} />
      </div>
    </div>
  );
}
