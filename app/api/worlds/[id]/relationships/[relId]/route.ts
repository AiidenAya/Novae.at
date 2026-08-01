import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getWorldAndCharacter(worldId: string, characterId: string, userId: string) {
  const [world, character] = await Promise.all([
    prisma.world.findUnique({ where: { id: worldId }, select: { id: true, creatorId: true } }),
    prisma.character.findUnique({ where: { id: characterId }, select: { id: true, userId: true, worldId: true } }),
  ]);

  if (!world || !character) return null;
  if (world.creatorId !== userId && character.userId !== userId) return null;

  return { world, character };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; relId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, relId } = await params;
  const access = await getWorldAndCharacter(id, relId, session.user.id);
  if (!access) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const updatedCharacter = await prisma.character.update({
    where: { id: access.character.id },
    data: { worldId: id },
    select: { id: true, worldId: true },
  });

  return NextResponse.json({
    id: updatedCharacter.id,
    worldId: updatedCharacter.worldId,
    belongsToWorld: updatedCharacter.worldId === id,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; relId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, relId } = await params;
  const access = await getWorldAndCharacter(id, relId, session.user.id);
  if (!access) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  await prisma.character.update({
    where: { id: access.character.id },
    data: { worldId: null },
    select: { id: true },
  });

  return new NextResponse(null, { status: 204 });
}
