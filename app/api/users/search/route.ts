import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const multi = req.nextUrl.searchParams.get("multi");

  // multi mode: partial match, returns a list of users
  if (multi) {
    if (!q) return NextResponse.json({ users: [] });
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, username: true, name: true, avatar: true },
      take: 8,
      orderBy: { username: "asc" },
    });
    return NextResponse.json({ users });
  }

  if (!q) return NextResponse.json({ user: null });

  const user = await prisma.user.findFirst({
    where: { username: q },
    select: { username: true, name: true, avatar: true },
  });

  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      username: user.username,
      displayName: user.name ?? user.username,
      avatar: user.avatar ?? null,
    },
  });
}
