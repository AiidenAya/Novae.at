import { NextResponse } from "next/server";
import { addToWaitlist } from "@/lib/brevo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({ email: undefined }));

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  await addToWaitlist(email);

  return NextResponse.json({ ok: true });
}
