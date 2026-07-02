import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReferralsClient } from "./_client";

const MAX_REFERRAL_CODES = 5;

export default async function ReferralsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const codes = await prisma.inviteCode.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, code: true, createdAt: true, expiresAt: true, usedAt: true,
      usedBy: { select: { username: true, avatar: true } },
    },
  });

  const serialized = codes.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    expiresAt: c.expiresAt?.toISOString() ?? null,
    usedAt: c.usedAt?.toISOString() ?? null,
  }));

  return <ReferralsClient initialCodes={serialized} max={MAX_REFERRAL_CODES} />;
}
