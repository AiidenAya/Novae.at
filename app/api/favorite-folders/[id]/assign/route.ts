import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Assign one of my favorites (identified by its characterId) to a favorite folder.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folderId = (await params).id;
  const { characterId, remove } = await req.json().catch(() => ({}));
  if (!characterId) return NextResponse.json({ error: "Missing characterId" }, { status: 400 });

  // verify the folder belongs to me (unless removing)
  if (!remove) {
    const folder = await prisma.favoriteFolder.findUnique({ where: { id: folderId }, select: { userId: true } });
    if (!folder || folder.userId !== session.user.id) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const fav = await prisma.favorite.findUnique({
    where: { userId_characterId: { userId: session.user.id, characterId } },
    select: { id: true },
  });
  if (!fav) return NextResponse.json({ error: "Favorite not found" }, { status: 404 });

  await prisma.favorite.update({
    where: { id: fav.id },
    data: { folderId: remove ? null : folderId },
  });
  return NextResponse.json({ ok: true });
}
