import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CHAR_SELECT = { id: true, name: true, numId: true, slug: true, avatarUrl: true };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    ...a.map((r) => ({ id: r.id, type: r.type, description: r.description, character: r.characterB })),
    // From B's perspective: use typeB if set, otherwise fall back to type
    ...b.map((r) => ({ id: r.id, type: r.typeB ?? r.type, description: r.description, character: r.characterA })),
  ];
  return NextResponse.json(relationships);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { characterBId, type, typeB, description } = await req.json();
  if (!characterBId || !type) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const rel = await prisma.relationship.create({
    data: { characterAId: id, characterBId, type, typeB: typeB ?? null, description: description ?? null },
    include: { characterB: { select: CHAR_SELECT } },
  });
  return NextResponse.json({ id: rel.id, type: rel.type, description: rel.description, character: rel.characterB });
}
