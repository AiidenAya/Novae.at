import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFollowers } from "@/lib/notifications";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "character";
  let i = 0;
  while (await prisma.character.findUnique({ where: { slug } })) {
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
  const scope = searchParams.get("scope"); // "own" (default) | "all"
  const userId = searchParams.get("userId"); // filter to a specific user's characters

  const ownId = session.user.id;
  const where: Record<string, unknown> = {};
  if (userId) {
    // characters of a specific user — own ones unrestricted, others must be public
    where.userId = userId;
    if (userId !== ownId) where.isPublic = true;
  } else if (scope === "all") {
    where.isPublic = true;
  } else {
    where.userId = ownId;
  }

  const characters = await prisma.character.findMany({
    where: {
      ...where,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(exclude && { id: { not: exclude } }),
    },
    select: { id: true, name: true, avatarUrl: true, numId: true, slug: true, user: { select: { username: true } } },
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, isDesigner, designerCredit, isWriter, writerCredit } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = await uniqueSlug(toSlug(name.trim()));

  const character = await prisma.character.create({
    data: {
      name: name.trim(),
      slug,
      userId: session.user.id,
      isDesigner: isDesigner !== false,
      designerCredit: isDesigner !== false ? null : (designerCredit ?? null),
      isWriter: isWriter !== false,
      writerCredit: isWriter !== false ? null : (writerCredit ?? null),
    },
  });

  // fire-and-forget: notify followers
  notifyFollowers(session.user.id, "new_character", { characterId: character.id }).catch(() => {});

  return NextResponse.json(character, { status: 201 });
}
