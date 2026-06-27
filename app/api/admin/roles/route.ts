import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isRoleIconKey } from "@/lib/role-icons";

function parseIcon(value: unknown): string | null {
  if (value === null || value === "") return null;
  return isRoleIconKey(value) ? value : null;
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  return user?.roles.includes("admin") ? session.user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const roles = await prisma.role.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, icon } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const slug = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!slug) return NextResponse.json({ error: "Invalid name" }, { status: 400 });

  const existing = await prisma.role.findUnique({ where: { name: slug } });
  if (existing) return NextResponse.json({ error: "Role already exists" }, { status: 409 });

  const role = await prisma.role.create({
    data: { name: slug, description: description?.trim() || null, icon: parseIcon(icon) },
  });
  return NextResponse.json(role, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, description, icon } = await req.json();
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: { description?: string | null; icon?: string | null } = {};
  if (description !== undefined) data.description = description?.trim() || null;
  if (icon !== undefined) data.icon = parseIcon(icon);

  const updated = await prisma.role.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (["user", "admin"].includes(role.name)) return NextResponse.json({ error: "Cannot delete built-in role" }, { status: 400 });

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
