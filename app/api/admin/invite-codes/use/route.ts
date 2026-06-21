import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!code) return NextResponse.json({ error: "Code manquant" }, { status: 400 });

  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);

  const invite = await prisma.inviteCode.findUnique({ where: { code: String(code) } });
  if (!invite || invite.usedAt) return NextResponse.json({ error: "Code invalide" }, { status: 400 });

  await prisma.inviteCode.update({
    where: { id: invite.id },
    data: { usedAt: new Date(), usedById: session?.user?.id ?? null },
  });

  return NextResponse.json({ ok: true });
}
