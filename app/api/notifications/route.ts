import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, type: true, read: true, createdAt: true,
      actor: { select: { id: true, username: true, name: true, avatar: true } },
      character: { select: { id: true, numId: true, slug: true, name: true, avatarUrl: true } },
      artwork: { select: { id: true, thumbnailUrl: true, imageUrl: true, title: true } },
    },
  });

  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json().catch(() => ({ ids: null }));

  if (Array.isArray(ids)) {
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, id: { in: ids } },
      data: { read: true },
    });
  } else {
    // mark all read
    await prisma.notification.updateMany({
      where: { recipientId: session.user.id, read: false },
      data: { read: true },
    });
  }

  return new NextResponse(null, { status: 204 });
}
