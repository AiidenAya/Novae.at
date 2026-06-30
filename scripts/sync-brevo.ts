import { PrismaClient } from "../lib/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const BREVO_BASE = "https://api.brevo.com/v3";
const FROM_LIST = 2;
const TO_LIST = 5;

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, name: true } });
  console.log(`Moving ${users.length} contacts from list ${FROM_LIST} → list ${TO_LIST}…`);

  const emails = users.map((u) => u.email);

  // Add to list 5
  const addRes = await fetch(`${BREVO_BASE}/contacts/lists/${TO_LIST}/contacts/add`, {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  });
  if (!addRes.ok) {
    const body = await addRes.text().catch(() => "");
    console.error(`Failed to add to list ${TO_LIST}: ${addRes.status} ${body}`);
    process.exit(1);
  }
  console.log(`✓ Added to list ${TO_LIST}`);

  // Remove from list 2
  const removeRes = await fetch(`${BREVO_BASE}/contacts/lists/${FROM_LIST}/contacts/remove`, {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  });
  if (!removeRes.ok) {
    const body = await removeRes.text().catch(() => "");
    console.error(`Failed to remove from list ${FROM_LIST}: ${removeRes.status} ${body}`);
    process.exit(1);
  }
  console.log(`✓ Removed from list ${FROM_LIST}`);

  console.log("Done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
