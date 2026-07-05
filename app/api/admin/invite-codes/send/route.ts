import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInviteCodeEmail } from "@/lib/brevo";

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

const codeSelect = {
  id: true, code: true, note: true, createdAt: true, expiresAt: true, usedAt: true,
  usedBy: { select: { username: true } },
  createdBy: { select: { username: true, roles: true } },
} as const;

async function generateUniqueCode(): Promise<string> {
  let code = generateCode();
  // Retry on collision (extremely unlikely)
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }
  return code;
}

export async function POST(req: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const emails: unknown[] = Array.isArray(body.emails) ? body.emails : body.email ? [body.email] : [];
  const cleaned = [...new Set(emails.filter((e): e is string => typeof e === "string" && e.trim() !== "").map((e) => e.trim()))];

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Missing email(s)" }, { status: 400 });
  }

  const results = [];
  for (const email of cleaned) {
    const code = await generateUniqueCode();
    const created = await prisma.inviteCode.create({
      data: { code, note: email, createdById: user.id },
      select: codeSelect,
    });

    try {
      await sendInviteCodeEmail(email, code);
      results.push({ email, code: created, emailSent: true });
    } catch (err) {
      console.error(err);
      results.push({ email, code: created, emailSent: false });
    }
  }

  return NextResponse.json({ results }, { status: 201 });
}
