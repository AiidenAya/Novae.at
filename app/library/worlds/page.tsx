import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorldLibrary from "./WorldLibrary";

export default async function WorldsLibraryPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) redirect("/login");

  const worlds = await prisma.world.findMany({
    where: { creatorId: session.user.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      numId: true,
      name: true,
      slug: true,
      description: true,
      coverImageUrl: true,
      locations: { select: { id: true, name: true } },
      characters: { select: { id: true, name: true, numId: true } },
    },
  });

  return (
    <main style={{ width: "100%", padding: "40px 24px", fontFamily: "var(--font-dm-sans)" }}>
      <div className="library-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-3xl)", fontWeight: 700, color: "var(--novae-text-primary)", margin: 0 }}>
          My Worlds
        </h1>
        <Link
          href="/library/new/world"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "var(--novae-btn-primary)", border: "none", borderRadius: "var(--novae-radius-md)", color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-base)", fontWeight: 600, textDecoration: "none" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New world
        </Link>
      </div>

      <WorldLibrary worlds={worlds} />
    </main>
  );
}