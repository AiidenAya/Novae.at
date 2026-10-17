import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const world = await prisma.world.findUnique({ where: { id } });
  if (world?.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.some((v) => typeof v !== "string")) {
    return NextResponse.json({ error: "ids must be an array of gallery ids" }, { status: 400 });
  }

  const galleries = await prisma.worldGallery.findMany({ where: { worldId: id }, select: { id: true } });
  const validIds = new Set(galleries.map((g) => g.id));
  if (ids.length !== galleries.length || ids.some((v) => !validIds.has(v))) {
    return NextResponse.json({ error: "ids must match this world's galleries" }, { status: 400 });
  }

  await prisma.$transaction(
    ids.map((galleryId: string, order: number) =>
      prisma.worldGallery.update({ where: { id: galleryId }, data: { order } })
    )
  );

  return new NextResponse(null, { status: 204 });
}