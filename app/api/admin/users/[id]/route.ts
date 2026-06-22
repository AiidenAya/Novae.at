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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { username, name, roles } = await req.json() as { username?: string; name?: string; roles?: string[] };

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(username !== undefined ? { username: username.toLowerCase().trim() || null } : {}),
      ...(name     !== undefined ? { name:     name.trim()                  || null } : {}),
      ...(roles    !== undefined ? { roles } : {}),
    },
    select: { id: true, username: true, name: true, email: true, roles: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (id === admin.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
