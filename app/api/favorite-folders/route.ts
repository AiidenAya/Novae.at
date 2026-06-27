import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  return session?.user ?? null;
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const folder = await prisma.favoriteFolder.create({
    data: { name: name.trim(), userId: user.id },
    select: { id: true, name: true, createdAt: true },
  });
  return NextResponse.json(folder, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const folder = await prisma.favoriteFolder.findUnique({ where: { id }, select: { userId: true } });
  if (!folder || folder.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.favoriteFolder.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
