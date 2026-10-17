import { prisma } from "@/lib/prisma";
import { sendInviteCodeEmail } from "@/lib/brevo";

function generateCode(): string {
  const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NOVA-${seg()}-${seg()}`;
}

export async function generateUniqueCode(): Promise<string> {
  let code = generateCode();
  // Retry on collision (extremely unlikely)
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = generateCode();
  }
  return code;
}

// Generates a unique invite code, persists it, and emails it to the recipient —
// the same sequence the admin "Send access code" flow uses.
export async function createAndSendInviteCode(email: string, createdById: string, note = email) {
  const code = await generateUniqueCode();
  const created = await prisma.inviteCode.create({ data: { code, note, createdById } });
  await sendInviteCodeEmail(email, code);
  return created;
}
