import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order } = await req.json();
  if (!Array.isArray(order)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const updates = order.map((entry: { id: string; order: number }) => prisma.world.updateMany({ where: { id: entry.id, creatorId: session.user.id }, data: { order: entry.order } }));
  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
