import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { thumbUrl } from "@/lib/thumb";

export const revalidate = 60;

async function getData() {
  const shuffle = <T,>(arr: T[]) => arr.map((v) => ({ v, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.v);
  const [latestChars, allChars, allUsers] = await Promise.all([
    prisma.character.findMany({
      where: { isPublic: true, OR: [{ folderId: null }, { folder: { isPublic: true } }] },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true, numId: true, slug: true, name: true, avatarUrl: true,
        _count: { select: { artworks: true, favorites: true } },
        user: { select: { username: true, name: true } },
      },
    }),
    prisma.character.findMany({
      where: { isPublic: true, OR: [{ folderId: null }, { folder: { isPublic: true } }] },
      orderBy: { createdAt: "asc" },
      take: 40,
      select: {
        id: true, numId: true, slug: true, name: true, avatarUrl: true,
        _count: { select: { artworks: true, favorites: true } },
        user: { select: { username: true, name: true } },
      },
    }),
    prisma.user.findMany({
      where: { username: { not: null }, characters: { some: { isPublic: true } } },
      take: 30,
      select: {
        id: true, username: true, name: true, avatar: true,
        _count: { select: { characters: true, artworks: true, followers: true } },
      },
    }),
  ]);
  const latestIds = new Set(latestChars.map((c) => c.id));
  const randomChars = shuffle(allChars.filter((c) => !latestIds.has(c.id))).slice(0, 7);
  const randomUsers = shuffle(allUsers).slice(0, 5);
  return { latestChars, randomChars, randomUsers };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xl)", fontWeight: 700, color: "var(--novae-text-primary)" }}>
        {children}
      </h2>
      <div style={{ height: 1, width: 48, backgroundColor: "var(--novae-btn-primary)", borderRadius: 1 }} />
    </div>
  );
}

type CharacterData = {
  id: string; numId: number; slug: string; name: string; avatarUrl: string | null;
  _count: { artworks: number; favorites: number };
  user: { username: string | null; name: string | null };
};

function CharCard({ char }: { char: CharacterData }) {
  return (
    <Link href={`/library/characters/${char.numId}-${char.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", overflow: "hidden" }}>
        <div style={{ aspectRatio: "1/1", background: "rgba(105,61,169,0.1)", overflow: "hidden" }}>
          {char.avatarUrl
            ? <img src={thumbUrl(char.avatarUrl, 320) ?? char.avatarUrl} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", backgroundImage: "repeating-conic-gradient(rgba(136,136,136,0.12) 0% 25%, transparent 0% 50%)", backgroundSize: "20px 20px" }} />
          }
        </div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {char.name}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            by {char.user.name ?? char.user.username ?? "unknown"}
          </span>
          <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {char._count.favorites}
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              {char._count.artworks}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

type UserData = {
  id: string; username: string | null; name: string | null; avatar: string | null;
  _count: { characters: number; artworks: number; followers: number };
};

function UserCard({ user }: { user: UserData }) {
  if (!user.username) return null;
  return (
    <Link href={`/${user.username}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "var(--novae-bg-card)", border: "1px solid var(--novae-outline-all)", borderRadius: "var(--novae-radius-md)", padding: "16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ width: 48, height: 48, borderRadius: "var(--novae-radius-md)", overflow: "hidden", background: "rgba(105,61,169,0.15)", flexShrink: 0 }}>
          {user.avatar
            ? <img src={thumbUrl(user.avatar, 96) ?? user.avatar} alt={user.name ?? user.username} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 20, color: "var(--novae-text-link)" }}>
                {(user.name ?? user.username)?.[0]?.toUpperCase() ?? "?"}
              </div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", fontWeight: 600, color: "var(--novae-text-link)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name ?? user.username}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
            @{user.username}
          </span>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.characters} chars
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.artworks} arts
            </span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "var(--novae-text-xs)", color: "var(--novae-text-secondary)" }}>
              {user._count.followers} followers
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function Home() {
  const { latestChars, randomChars, randomUsers } = await getData();

  return (
    <div style={{ padding: "40px 24px 80px", display: "flex", flexDirection: "column", gap: 56 }}>

      {/* Hero */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-space-grotesk)", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, color: "var(--novae-text-primary)", lineHeight: 1.15 }}>
          Welcome to{" "}
          <span style={{ color: "var(--novae-btn-primary)" }}>Novae</span>
        </h1>
        <p style={{ margin: 0, fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-lg)", color: "var(--novae-text-secondary)", maxWidth: 520 }}>
          A home for your original characters — share, discover, and connect with other creators.
        </p>
      </div>

      {/* Latest characters */}
      <section>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <SectionHeading>Recently added</SectionHeading>
          <Link href="/browse/characters" style={{ fontFamily: "var(--font-dm-sans)", fontSize: "var(--novae-text-sm)", color: "var(--novae-text-link)", textDecoration: "none", fontStyle: "italic", marginTop: 4, flexShrink: 0 }}>
            Browse all →
          </Link>
        </div>
        {latestChars.length === 0
          ? <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>No characters yet.</p>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {latestChars.map((c) => <CharCard key={c.id} char={c} />)}
            </div>
        }
      </section>

      {/* Discover characters */}
      <section>
        <SectionHeading>Discover characters</SectionHeading>
        {randomChars.length === 0
          ? <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>No characters yet.</p>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
              {randomChars.map((c) => <CharCard key={c.id} char={c} />)}
            </div>
        }
      </section>

      {/* Discover creators */}
      <section>
        <SectionHeading>Discover creators</SectionHeading>
        {randomUsers.length === 0
          ? <p style={{ color: "var(--novae-text-secondary)", fontFamily: "var(--font-dm-sans)" }}>No creators yet.</p>
          : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {randomUsers.map((u) => <UserCard key={u.id} user={u} />)}
            </div>
        }
      </section>

    </div>
  );
}
