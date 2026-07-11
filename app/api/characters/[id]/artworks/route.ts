import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyFollowers } from "@/lib/notifications";
import { creditsInclude, resolveCredits } from "@/lib/artwork-credits";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (character.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { imageUrl, thumbnailUrl, credits, sensitiveType } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  const resolvedCredits = await resolveCredits(credits);
  if (!resolvedCredits) return NextResponse.json({ error: "At least one valid credit is required" }, { status: 400 });

  const artwork = await prisma.artwork.create({
    data: {
      imageUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      sensitiveType: sensitiveType === "gore" || sensitiveType === "nudity" ? sensitiveType : null,
      userId: session.user.id,
      characters: { connect: { id } },
      credits: { create: resolvedCredits },
    },
    include: creditsInclude,
  });

  notifyFollowers(session.user.id, "new_artwork", { characterId: id, artworkId: artwork.id }).catch(() => {});

  return NextResponse.json(artwork, { status: 201 });
}
