import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileWebsiteList } from "@/lib/brevo";

// Heals drift between the DB and Brevo's "website" list (e.g. from a failed
// create/update hook). Triggered by Vercel Cron — see vercel.json.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { email: true, name: true } });

  try {
    await reconcileWebsiteList(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Reconciliation failed" }, { status: 500 });
  }

  return NextResponse.json({ synced: users.length });
}
