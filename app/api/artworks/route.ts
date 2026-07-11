import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFollowers } from "@/lib/notifications";
import { creditsInclude, resolveCredits } from "@/lib/artwork-credits";

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

  const { artworkId, credits, characterIds, sensitiveType } = await req.json();
  if (!artworkId) return NextResponse.json({ error: "artworkId required" }, { status: 400 });

  const artwork = await prisma.artwork.findUnique({ where: { id: artworkId } });
  if (!artwork) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (artwork.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let resolvedCredits: Awaited<ReturnType<typeof resolveCredits>> = null;
  if (credits !== undefined) {
    resolvedCredits = await resolveCredits(credits);
    if (!resolvedCredits) return NextResponse.json({ error: "At least one valid credit is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (sensitiveType === "gore" || sensitiveType === "nudity" || sensitiveType === null) data.sensitiveType = sensitiveType ?? null;
  if (resolvedCredits) data.credits = { deleteMany: {}, create: resolvedCredits };

  if (Array.isArray(characterIds)) {
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
    include: { characters: { select: { id: true, name: true, numId: true, slug: true } }, ...creditsInclude },
  });
  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { imageUrl, thumbnailUrl, credits, characterIds, sensitiveType } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  const resolvedCredits = await resolveCredits(credits);
  if (!resolvedCredits) return NextResponse.json({ error: "At least one valid credit is required" }, { status: 400 });

  const ids: string[] = Array.isArray(characterIds) ? characterIds : [];

  if (ids.length > 0) {
    const chars = await prisma.character.findMany({ where: { id: { in: ids } }, select: { userId: true } });
    if (chars.some((c) => c.userId !== session.user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const artwork = await prisma.artwork.create({
    data: {
      imageUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      sensitiveType: sensitiveType === "gore" || sensitiveType === "nudity" ? sensitiveType : null,
      userId: session.user.id,
      characters: ids.length > 0 ? { connect: ids.map((id) => ({ id })) } : undefined,
      credits: { create: resolvedCredits },
    },
    include: { characters: { select: { id: true, name: true, numId: true, slug: true } }, ...creditsInclude },
  });

  notifyFollowers(session.user.id, "new_artwork", {
    characterId: ids[0] ?? undefined,
    artworkId: artwork.id,
  }).catch(() => {});

  return NextResponse.json(artwork, { status: 201 });
}
