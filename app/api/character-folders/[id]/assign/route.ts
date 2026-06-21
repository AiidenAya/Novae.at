import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folderId = (await params).id;
  const { characterId, remove } = await req.json().catch(() => ({}));
  if (!characterId) return NextResponse.json({ error: "Missing characterId" }, { status: 400 });

  const char = await prisma.character.findUnique({ where: { id: characterId }, select: { userId: true } });
  if (!char || char.userId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.character.update({
    where: { id: characterId },
    data: { folderId: remove ? null : folderId },
  });
  return NextResponse.json({ ok: true });
}
