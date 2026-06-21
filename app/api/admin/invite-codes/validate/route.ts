import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ valid: false, error: "Code manquant" });

  const invite = await prisma.inviteCode.findUnique({ where: { code: String(code).trim().toUpperCase() } });

  if (!invite) return NextResponse.json({ valid: false, error: "Code invalide" });
  if (invite.usedAt) return NextResponse.json({ valid: false, error: "Code déjà utilisé" });
  if (invite.expiresAt && invite.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "Code expiré" });

  return NextResponse.json({ valid: true, id: invite.id });
}
