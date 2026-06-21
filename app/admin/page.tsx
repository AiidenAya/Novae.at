import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") redirect("/");

  const [totalUsers, totalCharacters, totalArtworks, recentUsers, inviteCodes] = await Promise.all([
    prisma.user.count(),
    prisma.character.count(),
    prisma.artwork.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, username: true, name: true, email: true, role: true, createdAt: true, invitesUsed: { select: { code: true }, take: 1 } },
    }),
    prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, code: true, note: true, createdAt: true,
        expiresAt: true, usedAt: true,
        usedBy: { select: { username: true } },
      },
    }),
  ]);

  return (
    <AdminClient
      stats={{ totalUsers, totalCharacters, totalArtworks }}
      recentUsers={recentUsers.map(u => ({ ...u, createdAt: u.createdAt.toISOString(), inviteCode: u.invitesUsed[0]?.code ?? null }))}
      initialCodes={inviteCodes.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        expiresAt: c.expiresAt?.toISOString() ?? null,
        usedAt: c.usedAt?.toISOString() ?? null,
        usedBy: c.usedBy ?? null,
      }))}
    />
  );
}
