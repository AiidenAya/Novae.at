import { NextResponse } from "next/server";
import { addToWaitlist, sendInviteCodeEmail } from "@/lib/brevo";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_CODE_OWNER_USERNAME = "aiiden";

function generateCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NOVA-${seg()}-${seg()}`;
}

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
  const { email } = await req.json().catch(() => ({ email: undefined }));

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    return NextResponse.json({ error: "already_registered" }, { status: 409 });
  }

  const existingCode = await prisma.inviteCode.findFirst({ where: { note: email }, select: { id: true } });
  if (existingCode) {
    return NextResponse.json({ error: "already_on_waitlist" }, { status: 409 });
  }

  await addToWaitlist(email);

  const owner = await prisma.user.findUnique({ where: { username: WAITLIST_CODE_OWNER_USERNAME }, select: { id: true } });
  if (owner) {
    const code = await generateUniqueCode();
    await prisma.inviteCode.create({ data: { code, note: email, createdById: owner.id } });
    await sendInviteCodeEmail(email, code);
  }

  return NextResponse.json({ ok: true });
}
