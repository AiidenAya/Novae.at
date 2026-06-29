import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ valid: false, error: "Code missing" });

  const invite = await prisma.inviteCode.findUnique({ where: { code: String(code).trim().toUpperCase() } });

  if (!invite) return NextResponse.json({ valid: false, error: "Invalid code" });
  if (invite.usedAt) return NextResponse.json({ valid: false, error: "Code already used" });
  if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "Code expired" });

  return NextResponse.json({ valid: true, id: invite.id });
}
