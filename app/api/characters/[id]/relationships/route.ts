import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

const CHAR_SELECT = { id: true, name: true, numId: true, slug: true, avatarUrl: true };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id }, select: { userId: true } });
  const isOwner = !!session?.user && session.user.id === character?.userId;

  const [a, b] = await Promise.all([
    prisma.relationship.findMany({
      where: { characterAId: id },
      include: { characterB: { select: CHAR_SELECT } },
    }),
    prisma.relationship.findMany({
      where: { characterBId: id },
      include: { characterA: { select: CHAR_SELECT } },
    }),
  ]);
  const relationships = [
    // requester side (characterA): show accepted to everyone; pending only to the owner
    ...a
      .filter((r) => r.status === "accepted" || isOwner)
      .map((r) => ({
        id: r.id, type: r.type, typeRaw: r.type, typeBRaw: r.typeB, isA: true,
        status: r.status,
        description: r.description,
        character: r.characterB ?? null,
        externalName: r.externalName ?? null,
        externalImageUrl: r.externalImageUrl ?? null,
      })),
    // recipient side (characterB): only show once accepted
    ...b
      .filter((r) => r.status === "accepted")
      .map((r) => ({
        id: r.id, type: r.typeB ?? r.type, typeRaw: r.type, typeBRaw: r.typeB, isA: false,
        status: r.status,
        description: r.description,
        character: r.characterA,
        externalName: null,
        externalImageUrl: null,
      })),
  ];
  return NextResponse.json(relationships);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { characterBId, externalName, externalImageUrl, type, typeB, description } = await req.json();
  if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });
  if (!characterBId && !externalName?.trim()) return NextResponse.json({ error: "Missing character" }, { status: 400 });

  // if characterB belongs to a different user, the relationship is pending until they accept
  let status = "accepted";
  let otherOwnerId: string | null = null;
  if (characterBId) {
    const charB = await prisma.character.findUnique({ where: { id: characterBId }, select: { userId: true } });
    if (charB && charB.userId !== session.user.id) {
      status = "pending";
      otherOwnerId = charB.userId;
    }
  }

  const rel = await prisma.relationship.create({
    data: {
      characterAId: id,
      characterBId: characterBId ?? null,
      externalName: externalName?.trim() ?? null,
      externalImageUrl: externalImageUrl?.trim() ?? null,
      type,
      typeB: typeB ?? null,
      description: description ?? null,
      status,
      requestedById: session.user.id,
    },
    include: { characterB: { select: CHAR_SELECT } },
  });

  // notify the other owner to accept/decline
  if (status === "pending" && otherOwnerId) {
    notifyUser(otherOwnerId, session.user.id, "rel_request", { characterId: characterBId, relationshipId: rel.id }).catch(() => {});
  }

  return NextResponse.json({
    id: rel.id, type: rel.type, typeRaw: rel.type, typeBRaw: rel.typeB, isA: true,
    status: rel.status,
    description: rel.description,
    character: rel.characterB ?? null,
    externalName: rel.externalName ?? null,
    externalImageUrl: rel.externalImageUrl ?? null,
  });
}
