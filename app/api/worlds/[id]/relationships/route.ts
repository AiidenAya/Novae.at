import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const { id } = await params;

  const world = await prisma.world.findUnique({ where: { id }, select: { id: true, creatorId: true } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = !!session?.user && session.user.id === world.creatorId;

  const characters = await prisma.character.findMany({
    where: { worldId: id },
    select: {
      id: true,
      name: true,
      numId: true,
      slug: true,
      avatarUrl: true,
      user: { select: { username: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    characters.map((character) => ({
      ...character,
      belongsToWorld: true,
      canEdit: isOwner,
    })),
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const world = await prisma.world.findUnique({ where: { id }, select: { id: true, creatorId: true } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { characterId } = await req.json();
  if (!characterId) return NextResponse.json({ error: "Missing character" }, { status: 400 });

  const character = await prisma.character.findUnique({ where: { id: characterId }, select: { id: true, userId: true } });
  if (!character) return NextResponse.json({ error: "Character not found" }, { status: 404 });
  if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updatedCharacter = await prisma.character.update({
    where: { id: character.id },
    data: { worldId: id },
    select: { id: true, worldId: true },
  });

  return NextResponse.json({
    id: updatedCharacter.id,
    worldId: updatedCharacter.worldId,
    belongsToWorld: updatedCharacter.worldId === id,
  });
}
