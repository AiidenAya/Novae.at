import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let slug = base || "world";
  let i = 0;
  while (true) {
    const existing = await prisma.world.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const world = await prisma.world.findUnique({ where: { id } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const allowed = ["name", "description", "avatarUrl", "coverImageUrl", "isPublic",
    "isDesigner", "designerCredit", "isWriter", "writerCredit",
    "summary", "biography", "sections", "profileBlockOrder"] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key] ?? null;
  }

  if ("name" in body && body.name?.trim() && body.name.trim() !== world.name) {
    data.slug = await uniqueSlug(toSlug(body.name.trim()), id);
  }

  try {
    const updated = await prisma.world.update({
      where: { id },
      data,
      select: { id: true, numId: true, slug: true, name: true },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[PATCH world] Prisma error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const world = await prisma.world.findUnique({ where: { id } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Delete artworks that belong only to this world
  const soloArtworks = await prisma.artwork.findMany({
    where: { worlds: { some: { id } } },
    include: { worlds: { select: { id: true } } },
  });
  const toDelete = soloArtworks.filter((a) => a.worlds.length === 1).map((a) => a.id);
  if (toDelete.length) await prisma.artwork.deleteMany({ where: { id: { in: toDelete } } });

  // Unlink characters from this world
  await prisma.character.updateMany({ where: { worldId: id }, data: { worldId: null } });

  await prisma.world.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}