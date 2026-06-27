import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_characterId: { userId: session.user.id, characterId: id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({
    data: { userId: session.user.id, characterId: id },
  });

  // notify the character owner (skip self-favorite)
  if (character.userId !== session.user.id) {
    notifyUser(character.userId, session.user.id, "new_favorite", { characterId: id }).catch(() => {});
  }

  return NextResponse.json({ favorited: true });
}
