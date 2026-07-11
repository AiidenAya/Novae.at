import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q) return NextResponse.json({ tags: [] });

  const tags = await prisma.tag.findMany({
    where: { name: { contains: q.replace(/\s+/g, "-"), mode: "insensitive" } },
    select: { id: true, name: true },
    take: 8,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ tags });
}
