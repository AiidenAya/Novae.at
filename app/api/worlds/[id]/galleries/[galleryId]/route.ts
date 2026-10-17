import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function verifyGalleryOwner(galleryId: string, userId: string) {
  const gallery = await prisma.worldGallery.findUnique({ where: { id: galleryId }, include: { world: { select: { creatorId: true } } } });
  return gallery?.world.creatorId === userId ? gallery : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; galleryId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { galleryId } = await params;
  if (!await verifyGalleryOwner(galleryId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const updated = await prisma.worldGallery.update({ where: { id: galleryId }, data: { name: name.trim() } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; galleryId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { galleryId } = await params;
  if (!await verifyGalleryOwner(galleryId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.worldGallery.delete({ where: { id: galleryId } });
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; galleryId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { galleryId } = await params;
  if (!await verifyGalleryOwner(galleryId, session.user.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { artworkId, remove } = await req.json();
  if (!artworkId) return NextResponse.json({ error: "artworkId required" }, { status: 400 });

  if (remove) {
    await prisma.worldGalleryImage.deleteMany({ where: { galleryId, artworkId } });
    return new NextResponse(null, { status: 204 });
  }

  const image = await prisma.worldGalleryImage.upsert({
    where: { galleryId_artworkId: { galleryId, artworkId } },
    create: { galleryId, artworkId },
    update: {},
  });
  return NextResponse.json(image, { status: 201 });
}