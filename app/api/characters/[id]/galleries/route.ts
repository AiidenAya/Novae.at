import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyOwner(characterId: string, userId: string) {
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  return character?.userId === userId ? character : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const galleries = await prisma.gallery.findMany({
    where: { characterId: id },
    include: { images: { orderBy: { order: "asc" }, select: { id: true, artworkId: true, order: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(galleries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await verifyOwner(id, session.user.id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const gallery = await prisma.gallery.create({
    data: { name: name.trim(), characterId: id },
    include: { images: true },
  });
  return NextResponse.json(gallery, { status: 201 });
}
