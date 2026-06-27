import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

// Accept or decline a pending cross-user relationship request.
// Only the owner of characterB (the recipient) may respond.
export async function POST(req: NextRequest, { params }: { params: Promise<{ relId: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { relId } = await params;
  const { action } = await req.json(); // "accept" | "decline"
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const rel = await prisma.relationship.findUnique({
    where: { id: relId },
    include: { characterB: { select: { userId: true } } },
  });
  if (!rel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (rel.status !== "pending") return NextResponse.json({ error: "Already resolved" }, { status: 409 });
  if (!rel.characterB || rel.characterB.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requesterId = rel.requestedById;

  if (action === "accept") {
    await prisma.relationship.update({ where: { id: relId }, data: { status: "accepted" } });
    if (requesterId) {
      notifyUser(requesterId, session.user.id, "rel_accepted", { characterId: rel.characterAId, relationshipId: rel.id }).catch(() => {});
    }
    return NextResponse.json({ status: "accepted" });
  }

  // decline → delete the relationship; notify requester (relationshipId becomes null via FK)
  if (requesterId) {
    await notifyUser(requesterId, session.user.id, "rel_declined", { characterId: rel.characterAId }).catch(() => {});
  }
  await prisma.relationship.delete({ where: { id: relId } });
  return NextResponse.json({ status: "declined" });
}
