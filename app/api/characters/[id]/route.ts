import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let slug = base || "character";
  let i = 0;
  while (true) {
    const existing = await prisma.character.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowed = ["name", "description", "avatarUrl", "backgroundImageUrl", "isPublic",
    "birthdate", "age", "height", "weight", "mbti", "kingdom", "ethnicity", "race", "gender", "orientation", "customFieldName", "custom", "voiceClaimUrl", "playlistUrl", "spotifyPlaylistUrl", "summary", "biography", "sections", "profileBlockOrder",
    "isDesigner", "designerCredit", "isWriter", "writerCredit"] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null;
  }

  if ("name" in body && body.name?.trim() && body.name.trim() !== character.name) {
    data.slug = await uniqueSlug(toSlug(body.name.trim()), id);
  }

  try {
    const updated = await prisma.character.update({ where: { id }, data, select: { id: true, numId: true, slug: true, name: true } });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH character] Prisma error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete artworks that belong only to this character
  const soloArtworks = await prisma.artwork.findMany({
    where: { characters: { some: { id } } },
    include: { characters: { select: { id: true } } },
  });
  const toDelete = soloArtworks.filter((a) => a.characters.length === 1).map((a) => a.id);
  if (toDelete.length) await prisma.artwork.deleteMany({ where: { id: { in: toDelete } } });

  await prisma.character.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
