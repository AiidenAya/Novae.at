import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export type CreditInput = { type: "onsite" | "offsite"; value: string; label?: string };

export const creditsInclude = {
  credits: {
    orderBy: { position: "asc" as const },
    include: { user: { select: { username: true, name: true, avatar: true } } },
  },
};

// Validates and resolves raw client credit input into rows ready for `credits: { create: [...] }`.
// Returns null if the payload is missing, empty, or any entry fails validation (unknown username, missing label/url).
export async function resolveCredits(
  raw: unknown,
): Promise<Prisma.ArtworkCreditUncheckedCreateWithoutArtworkInput[] | null> {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const rows: Prisma.ArtworkCreditUncheckedCreateWithoutArtworkInput[] = [];
  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i] as Partial<CreditInput> | null;
    if (!entry || typeof entry !== "object") return null;
    const value = String(entry.value ?? "").trim();

    if (entry.type === "onsite") {
      if (!value) return null;
      const user = await prisma.user.findFirst({
        where: { username: value.replace(/^@/, "") },
        select: { id: true },
      });
      if (!user) return null;
      rows.push({ position: i, userId: user.id });
    } else if (entry.type === "offsite") {
      const label = String(entry.label ?? "").trim();
      if (!value || !label) return null;
      rows.push({ position: i, label, url: value });
    } else {
      return null;
    }
  }
  return rows;
}
