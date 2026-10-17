import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT replaces the entire palette (swatches array)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const world = await prisma.world.findUnique({
    where: { id },
    include: { colorPalettes: true },
  });
  if (!world) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (world.creatorId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // swatches: { hex: string; label?: string }[]
  const { swatches } = await req.json() as { swatches: { hex: string; label?: string }[] };

  let palette = world.colorPalettes[0];

  if (!palette) {
    palette = await prisma.worldColorPalette.create({ data: { name: "Palette", worldId: id } });
  }

  // Replace all swatches
  await prisma.worldColorSwatch.deleteMany({ where: { paletteId: palette.id } });

  if (swatches?.length > 0) {
    await prisma.worldColorSwatch.createMany({
      data: swatches.map((s, i) => ({
        hex: s.hex,
        label: s.label ?? null,
        order: i,
        paletteId: palette.id,
      })),
    });
  }

  const updated = await prisma.worldColorPalette.findUnique({
    where: { id: palette.id },
    include: { swatches: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(updated);
}