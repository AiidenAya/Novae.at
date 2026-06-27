import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; artworkId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, artworkId } = await params;
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { characters: { select: { id: true } } } });
  if (!artwork || !artwork.characters.some((c) => c.id === id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artwork.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, characterIds, thumbnailUrl } = await req.json();
  const updated = await prisma.artwork.update({
    where: { id: artworkId },
    data: {
      title,
      ...(thumbnailUrl !== undefined && { thumbnailUrl: thumbnailUrl ?? null }),
      ...(Array.isArray(characterIds) && {
        characters: { set: characterIds.map((cid: string) => ({ id: cid })) },
      }),
    },
    include: { characters: { select: { id: true, name: true, numId: true, slug: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; artworkId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, artworkId } = await params;
  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId }, include: { characters: { select: { id: true } } } });
  if (!artwork || !artwork.characters.some((c) => c.id === id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artwork.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.artwork.delete({ where: { id: artworkId } });
  return new NextResponse(null, { status: 204 });
}
