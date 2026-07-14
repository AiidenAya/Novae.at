import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const follows = await prisma.follow.findMany({
    where: { followingId: target.id },
    orderBy: { createdAt: "desc" },
    select: { follower: { select: { username: true, name: true, avatar: true } } },
  });

  const followers = follows
    .map((f) => f.follower)
    .filter((u): u is { username: string; name: string | null; avatar: string | null } => !!u.username);

  return NextResponse.json({ followers });
}
