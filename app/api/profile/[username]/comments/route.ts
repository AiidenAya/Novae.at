import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const profile = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ comments: [] });

  const comments = await prisma.comment.findMany({
    where: { profileId: profile.id, parentId: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: { username: true, name: true, avatar: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          text: true,
          createdAt: true,
          author: { select: { username: true, name: true, avatar: true } },
        },
      },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const { text, parentId } = await req.json() as { text: string; parentId?: string };
  if (!text?.trim()) return NextResponse.json({ error: "Empty" }, { status: 400 });

  const profile = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      text,
      authorId: session.user.id,
      profileId: profile.id,
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      text: true,
      createdAt: true,
      author: { select: { username: true, name: true, avatar: true } },
      replies: true,
    },
  });

  return NextResponse.json({ comment });
}
