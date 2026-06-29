import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  return user?.roles.includes("admin") ? session.user : null;
}

async function getData() {
  const [totalUsers, totalCharacters, totalArtworks, recentUsers, codes, roles] = await Promise.all([
    prisma.user.count(),
    prisma.character.count(),
    prisma.artwork.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, username: true, name: true, email: true,
        roles: true, createdAt: true,
        invitesUsed: { select: { code: true }, take: 1 },
      },
    }),
    prisma.inviteCode.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, code: true, note: true, createdAt: true,
        expiresAt: true, usedAt: true,
        usedBy: { select: { username: true } },
      },
    }),
    prisma.role.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    stats: { totalUsers, totalCharacters, totalArtworks },
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email ?? "",
      roles: u.roles,
      createdAt: u.createdAt.toISOString(),
      inviteCode: u.invitesUsed[0]?.code ?? null,
    })),
    initialCodes: codes.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt?.toISOString() ?? null,
      usedAt: c.usedAt?.toISOString() ?? null,
    })),
    initialRoles: roles.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const { stats, recentUsers, initialCodes, initialRoles } = await getData();

  return (
    <AdminClient
      stats={stats}
      recentUsers={recentUsers}
      initialCodes={initialCodes}
      initialRoles={initialRoles}
    />
  );
}
