import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, tagId } = await params;
  const world = await prisma.world.findUnique({ where: { id } });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.worldTag.delete({
    where: { worldId_tagId: { worldId: id, tagId } },
  }).catch(() => {});

  return new NextResponse(null, { status: 204 });
}