import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Route files may only export HTTP handlers — keep this constant local.
const MAX_REFERRAL_CODES = 5;

function generateCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NOVA-${seg()}-${seg()}`;
}

const codeSelect = {
  id: true, code: true, createdAt: true, expiresAt: true, usedAt: true,
  usedBy: { select: { username: true, avatar: true } },
} as const;

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  return session?.user ?? null;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await prisma.inviteCode.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    select: codeSelect,
  });

  return NextResponse.json({ codes, max: MAX_REFERRAL_CODES });
}

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await prisma.inviteCode.count({ where: { createdById: user.id } });
  if (count >= MAX_REFERRAL_CODES) {
    return NextResponse.json({ error: "Limit reached" }, { status: 403 });
  }

  let code = generateCode();
  // Retry on collision (extremely unlikely)
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }

  const created = await prisma.inviteCode.create({
    data: { code, createdById: user.id },
    select: codeSelect,
  });

  return NextResponse.json(created, { status: 201 });
}
