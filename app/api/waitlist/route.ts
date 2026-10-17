import { NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/brevo";
import { prisma } from "@/lib/prisma";
import { createAndSendInviteCode } from "@/lib/inviteCodes";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_CODE_OWNER_USERNAME = "aiidenaya";

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
    try {
      await createAndSendInviteCode(email, owner.id);
    } catch (err) {
      console.error(`[waitlist] Failed to send invite code to ${email}:`, err);
    }
  } else {
    console.error(`[waitlist] Owner username "${WAITLIST_CODE_OWNER_USERNAME}" not found — no invite code sent to ${email}`);
  }

  return NextResponse.json({ ok: true });
}
