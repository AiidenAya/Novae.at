import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { artworkId } = await req.json();
  if (!artworkId) return NextResponse.json({ error: "artworkId required" }, { status: 400 });

  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artwork.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.artwork.delete({ where: { id: artworkId } });
  return new NextResponse(null, { status: 204 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { artworkId, title, characterIds } = await req.json();
  if (!artworkId) return NextResponse.json({ error: "artworkId required" }, { status: 400 });

  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artwork.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data: Record<string, unknown> = { title: title ?? null };

  if (Array.isArray(characterIds)) {
    // Verify all characters belong to this user
    if (characterIds.length > 0) {
      const chars = await prisma.character.findMany({ where: { id: { in: characterIds } }, select: { userId: true } });
      if (chars.some((c) => c.userId !== session.user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    data.characters = { set: characterIds.map((id: string) => ({ id })) };
  }

  const updated = await prisma.artwork.update({
    where: { id: artworkId },
    data,
    include: { characters: { select: { id: true, name: true, numId: true, slug: true } } },
  });
  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, title, characterIds } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  const ids: string[] = Array.isArray(characterIds) ? characterIds : [];

  // Verify all characters belong to this user
  if (ids.length > 0) {
    const chars = await prisma.character.findMany({ where: { id: { in: ids } }, select: { userId: true } });
    if (chars.some((c) => c.userId !== session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const artwork = await prisma.artwork.create({
    data: {
      imageUrl,
      title: title ?? null,
      userId: session.user.id,
      characters: ids.length > 0 ? { connect: ids.map((id) => ({ id })) } : undefined,
    },
    include: { characters: { select: { id: true, name: true, numId: true, slug: true } } },
  });

  return NextResponse.json(artwork, { status: 201 });
}
