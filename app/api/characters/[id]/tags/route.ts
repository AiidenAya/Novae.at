import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const normalised = name.trim().toLowerCase().replace(/\s+/g, "-");

  const tag = await prisma.tag.upsert({
    where: { name: normalised },
    create: { name: normalised },
    update: {},
  });

  await prisma.characterTag.upsert({
    where: { characterId_tagId: { characterId: id, tagId: tag.id } },
    create: { characterId: id, tagId: tag.id },
    update: {},
  });

  return NextResponse.json(tag, { status: 201 });
}
