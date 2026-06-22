import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, bio, pronouns, coverImage, avatar, socials, featuredCharacterIds, featuredFriendUsernames } =
    body as { name?: string; bio?: string; pronouns?: string; coverImage?: string; avatar?: string; socials?: Record<string, string>; featuredCharacterIds?: string[]; featuredFriendUsernames?: string[] };

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name                    !== undefined ? { name:                    name.trim()     || null } : {}),
      ...(bio                     !== undefined ? { bio:                     bio.trim()      || null } : {}),
      ...(pronouns                !== undefined ? { pronouns:                pronouns.trim() || null } : {}),
      ...(coverImage              !== undefined ? { coverImage:              coverImage      || null } : {}),
      ...(avatar                  !== undefined ? { avatar:                  avatar          || null } : {}),
      ...(socials                 !== undefined ? { socials } : {}),
      ...(featuredCharacterIds    !== undefined ? { featuredCharacterIds } : {}),
      ...(featuredFriendUsernames !== undefined ? { featuredFriendUsernames } : {}),
    },
    select: { name: true, bio: true, pronouns: true, coverImage: true, avatar: true, socials: true, featuredCharacterIds: true, featuredFriendUsernames: true },
  });

  return NextResponse.json(updated);
}
