import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const q = searchParams.get("q")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";
  const skip = Math.max(parseInt(searchParams.get("skip") ?? "0") || 0, 0);

  if (type === "characters") {
    const items = await prisma.character.findMany({
      where: {
        isPublic: true,
        OR: [{ folderId: null }, { folder: { isPublic: true } }],
        ...(q && { name: { contains: q, mode: "insensitive" } }),
        ...(tag && { tags: { some: { tag: { name: tag } } } }),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE + 1,
      select: {
        id: true, numId: true, slug: true, name: true, avatarUrl: true,
        _count: { select: { artworks: true, favorites: true } },
        user: { select: { username: true, name: true } },
      },
    });
    return NextResponse.json({ items: items.slice(0, PAGE_SIZE), hasMore: items.length > PAGE_SIZE });
  }

  if (type === "users") {
    const items = await prisma.user.findMany({
      where: {
        username: { not: null },
        ...(q && {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE + 1,
      select: {
        id: true, username: true, name: true, avatar: true,
        _count: { select: { characters: true, artworks: true, followers: true } },
      },
    });
    return NextResponse.json({ items: items.slice(0, PAGE_SIZE), hasMore: items.length > PAGE_SIZE });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
