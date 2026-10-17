import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; mapId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, mapId } = await params;
  const world = await prisma.world.findUnique({ where: { id }, select: { id: true, creatorId: true } });
  if (!world) return NextResponse.json({ error: "World not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.map.delete({ where: { id: mapId } });
  return new NextResponse(null, { status: 204 });
}