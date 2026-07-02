import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { roles: true } });
  if (!user?.roles.includes("admin")) return null;
  return session.user;
}

function generateCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NOVA-${seg()}-${seg()}`;
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, code: true, note: true, createdAt: true,
      expiresAt: true, usedAt: true,
      usedBy: { select: { username: true } },
      createdBy: { select: { username: true, roles: true } },
    },
  });
  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const note: string | undefined = body.username ?? body.note ?? undefined;

  let code = generateCode();
  // Retry on collision (extremely unlikely)
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }

  const created = await prisma.inviteCode.create({
    data: { code, note, createdById: user.id },
    select: { id: true, code: true, note: true, createdAt: true, expiresAt: true, usedAt: true, usedBy: { select: { username: true } }, createdBy: { select: { username: true, roles: true } } },
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.inviteCode.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
