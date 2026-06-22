import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
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
