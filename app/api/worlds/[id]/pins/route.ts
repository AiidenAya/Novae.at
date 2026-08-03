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
  const { title, description, lat, lng } = await req.json();
  const pin = await prisma.pin.create({ data: { worldId: id, title: title?.trim() || "Location", description: description?.trim() || null, lat: Number(lat ?? 0), lng: Number(lng ?? 0) } });
  return NextResponse.json(pin, { status: 201 });
}
