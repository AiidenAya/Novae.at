import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) return NextResponse.json({ email: null });

  const user = await prisma.user.findUnique({
    where: { username },
    select: { email: true },
  });

  return NextResponse.json({ email: user?.email ?? null });
}
