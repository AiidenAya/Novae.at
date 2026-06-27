import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  return user?.roles.includes("admin") ? session.user : null;
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { ids, addRoles, removeRoles } = await req.json() as {
    ids: string[];
    addRoles: string[];
    removeRoles: string[];
  };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No users specified" }, { status: 400 });
  }

  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, roles: true } });

  await Promise.all(users.map(u => {
    const next = new Set(u.roles);
    (addRoles ?? []).forEach((r: string) => next.add(r));
    (removeRoles ?? []).forEach((r: string) => next.delete(r));
    return prisma.user.update({ where: { id: u.id }, data: { roles: Array.from(next) } });
  }));

  return NextResponse.json({ ok: true, updated: ids.length });
}
