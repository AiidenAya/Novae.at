import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "world";
  let i = 0;
  while (await prisma.world.findUnique({ where: { slug } })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 100);
  const exclude = searchParams.get("exclude");
  const scope = searchParams.get("scope");
  const userId = searchParams.get("userId");

  const ownId = session.user.id;
  const where: Record<string, unknown> = {};
  if (userId) {
    where.creatorId = userId;
    if (userId !== ownId) where.isPublic = true;
  } else if (scope === "all") {
    where.isPublic = true;
  } else {
    where.creatorId = ownId;
  }

  const worlds = await prisma.world.findMany({
    where: {
      ...where,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(exclude && { id: { not: exclude } }),
    },
    select: { id: true, name: true, avatarUrl: true, numId: true, slug: true, creator: { select: { username: true } } },
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json(worlds);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, isDesigner, designerCredit, isWriter, writerCredit, baseWorldId, variantLabel } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = await uniqueSlug(toSlug(name.trim()));

  let baseWorld: { id: string; creatorId: string } | null = null;
  if (baseWorldId) {
    baseWorld = await prisma.world.findUnique({ where: { id: baseWorldId }, select: { id: true, creatorId: true } });
    if (!baseWorld || baseWorld.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Base world not found" }, { status: 404 });
    }
  }

  const world = await prisma.world.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      creatorId: session.user.id,
      isDesigner: isDesigner !== false,
      designerCredit: isDesigner !== false ? null : (designerCredit ?? null),
      isWriter: isWriter !== false,
      writerCredit: isWriter !== false ? null : (writerCredit ?? null),
      ...(baseWorld && { baseWorldId: baseWorld.id, variantLabel: variantLabel?.trim() || null }),
    },
  });

  return NextResponse.json(world, { status: 201 });
}
