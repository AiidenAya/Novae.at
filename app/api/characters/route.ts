import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "character";
  let i = 0;
  while (await prisma.character.findUnique({ where: { slug } })) {
    i++;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, avatarUrl: true, numId: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(characters);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, isDesigner, designerCredit, isWriter, writerCredit } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const slug = await uniqueSlug(toSlug(name.trim()));

  const character = await prisma.character.create({
    data: {
      name: name.trim(),
      slug,
      userId: session.user.id,
      isDesigner: isDesigner !== false,
      designerCredit: isDesigner !== false ? null : (designerCredit ?? null),
      isWriter: isWriter !== false,
      writerCredit: isWriter !== false ? null : (writerCredit ?? null),
    },
  });

  return NextResponse.json(character, { status: 201 });
}
