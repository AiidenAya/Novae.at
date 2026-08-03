import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const world = await prisma.world.findUnique({ where: { id }, select: { id: true, creatorId: true } });
  if (!world) return NextResponse.json({ error: "World not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, imageUrl } = await req.json();
  const map = await prisma.map.create({ data: { worldId: id, name: name?.trim() || "Map", imageUrl: imageUrl ?? null, bounds: {} } });
  return NextResponse.json(map, { status: 201 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const maps = await prisma.map.findMany({
    where: { worldId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(maps);
}
