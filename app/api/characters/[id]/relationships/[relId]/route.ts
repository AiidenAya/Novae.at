import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

async function getRelAndVerifyOwner(id: string, relId: string, userId: string) {
  const rel = await prisma.relationship.findUnique({ where: { id: relId } });
  if (!rel || (rel.characterAId !== id && rel.characterBId !== id)) return null;
  // only characterA's owner can edit (characterB side belongs to someone else's char)
  const character = await prisma.character.findUnique({ where: { id: rel.characterAId } });
  if (!character || character.userId !== userId) return null;
  return rel;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; relId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, relId } = await params;
  const rel = await getRelAndVerifyOwner(id, relId, session.user.id);
  if (!rel) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });

  const { type, typeB, description } = await req.json();
  // Use raw SQL to avoid cached PrismaClient validation (typeB added after initial client instantiation)
  await prisma.$executeRaw`
    UPDATE "Relationship"
    SET type = ${type ?? rel.type},
        "typeB" = ${typeB ?? null},
        description = ${description ?? null}
    WHERE id = ${relId}
  `;
  const updatedTypeB = typeB ?? null;
  const isA = rel.characterAId === id;
  return NextResponse.json({ type: isA ? type : (updatedTypeB ?? type), description: description ?? null });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; relId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, relId } = await params;
  const me = session.user.id;

  // either character's owner can remove the relationship
  const rel = await prisma.relationship.findUnique({
    where: { id: relId },
    include: { characterA: { select: { userId: true } }, characterB: { select: { userId: true } } },
  });
  if (!rel || (rel.characterAId !== id && rel.characterBId !== id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ownerA = rel.characterA?.userId ?? null;
  const ownerB = rel.characterB?.userId ?? null;
  if (me !== ownerA && me !== ownerB) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // notify the other party if this was an accepted cross-user relationship
  if (rel.status === "accepted" && ownerB && ownerA && ownerA !== ownerB) {
    const otherId = me === ownerA ? ownerB : ownerA;
    const otherCharId = me === ownerA ? rel.characterBId : rel.characterAId;
    notifyUser(otherId, me, "rel_declined", { characterId: otherCharId ?? undefined }).catch(() => {});
  }

  await prisma.relationship.delete({ where: { id: relId } });
  return new NextResponse(null, { status: 204 });
}
