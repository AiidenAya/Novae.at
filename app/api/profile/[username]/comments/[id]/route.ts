import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ username: string; id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const comment = await prisma.comment.findUnique({ where: { id }, select: { authorId: true, profile: { select: { id: true } } } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthor  = comment.authorId === session.user.id;
  const isOwner   = comment.profile.id === session.user.id;
  const sessionUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  const isAdmin   = sessionUser?.roles.includes("admin");

  if (!isAuthor && !isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
