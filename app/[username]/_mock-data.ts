// ── Types ─────────────────────────────────────────────────────────────────────

export type Profile = {
  displayName: string;
  username: string;
  pronouns: string;
  bio: string;
  coverImage: string;
  avatarImage: string | null;
  stats: { followers: number; artworks: number; characters: number; worlds: number };
  socials: { name: string; handle: string; href: string | null; link: boolean }[];
  latestForumPost: { title: string; body: string };
  characters: { name: string; hearts: number; images: number; coverImage: string | null }[];
  worlds:     { name: string; hearts: number; images: number; coverImage: string | null }[];
  featuredFriends: { username: string; avatar: string | null }[];
  comments: CommentData[];
};

export type CommentData = {
  id: number;
  username: string;
  avatar: null;
  date: string;
  text: string;
  replies?: CommentData[];
};

export type Artwork = {
  id: number;
  title: string;
  image: string | null;
  hearts: number;
  character: { numId: number; slug: string; name: string; avatar: string | null; owner: string } | null;
  aspectRatio?: string;
  fill?: string;
};

// ── Mock profile ──────────────────────────────────────────────────────────────

export const MOCK_PROFILE: Profile = {
  displayName: "Aiiden",
  username: "aiidenaya",
  pronouns: "She/They",
  bio: "Aiiden ☆ Artist & Designer ☆ They/Them ☆ \n🎨 Based in France ☆ \n✨ Creating art inspired by many artists ☆ \n📸 Follow for creative projects, design tips & vibrant visuals\n💌 Commissions open: aiidentravels@example.com",
  coverImage: "",
  avatarImage: null,
  stats: { followers: 8, artworks: 2, characters: 5, worlds: 5 },
  socials: [
    { name: "ArtFight",    handle: "@username",   href: "#",  link: true  },
    { name: "Bluesky",     handle: "@username",   href: "#",  link: true  },
    { name: "DeviantArt",  handle: "@username",   href: "#",  link: true  },
    { name: "Discord",     handle: "@username",   href: null, link: false },
    { name: "FurAffinity", handle: "@username",   href: "#",  link: true  },
    { name: "Instagram",   handle: "@username",   href: "#",  link: true  },
    { name: "Tumblr",      handle: "@username",   href: "#",  link: true  },
    { name: "Twitter",     handle: "@username",   href: "#",  link: true  },
    { name: "Custom link", handle: "custom link", href: "#",  link: true  },
  ],
  latestForumPost: {
    title: "Chapter Update",
    body: "Just finished the latest chapter of my story. I'm excited to share it with you all and can't wait to hear your thoughts!",
  },
  characters: [
    { name: "Saphira Aishi",  hearts: 2, images: 8, coverImage: null },
    { name: "Aiiden Mizune",  hearts: 2, images: 6, coverImage: null },
    { name: "Kira",           hearts: 5, images: 3, coverImage: null },
    { name: "Lune",           hearts: 3, images: 9, coverImage: null },
    { name: "Aria",           hearts: 1, images: 2, coverImage: null },
    { name: "Zenith",         hearts: 4, images: 7, coverImage: null },
  ],
  worlds: [
    { name: "Novae",         hearts: 4, images: 6, coverImage: null },
    { name: "The Drift",     hearts: 2, images: 3, coverImage: null },
    { name: "Ember Hollow",  hearts: 1, images: 2, coverImage: null },
  ],
  featuredFriends: Array(8).fill({ username: "Username", avatar: null }),
  comments: [
    { id: 1, username: "Username",   avatar: null, date: "10 Jun. 2026 · 21:08", text: "I kinda find the worlds pretty cooooool and all and uuh i kinda like it", replies: [] },
    { id: 2, username: "Username",   avatar: null, date: "10 Jun. 2026 · 21:09", text: "Love the characters, especially Saphira !", replies: [
      { id: 3, username: "aiidenaya", avatar: null, date: "11 Jun. 2026 · 22:10", text: "Thank you so so much !! <3" },
    ]},
  ],
};

// ── Folder types ──────────────────────────────────────────────────────────────

export type LibraryItem = {
  name: string;
  hearts: number;
  images: number;
  coverImage: string | null;
  slug?: string;
};

export type LibraryFolder = {
  id: string;
  name: string;
  items: LibraryItem[];
};

export const MOCK_CHARACTER_FOLDERS: LibraryFolder[] = [
  {
    id: "main",
    name: "Main characters",
    items: [
      { name: "Saphira Aishi", hearts: 2, images: 8, coverImage: null },
      { name: "Aiiden Mizune", hearts: 2, images: 6, coverImage: null },
    ],
  },
  {
    id: "side",
    name: "Side characters",
    items: [
      { name: "Kira",   hearts: 5, images: 3, coverImage: null },
      { name: "Lune",   hearts: 3, images: 9, coverImage: null },
      { name: "Aria",   hearts: 1, images: 2, coverImage: null },
      { name: "Zenith", hearts: 4, images: 7, coverImage: null },
    ],
  },
  {
    id: "unfiled",
    name: "Unfiled",
    items: [
      { name: "Nova",   hearts: 6, images: 4, coverImage: null },
      { name: "Echo",   hearts: 2, images: 5, coverImage: null },
      { name: "Vesper", hearts: 3, images: 1, coverImage: null },
      { name: "Solace", hearts: 0, images: 2, coverImage: null },
    ],
  },
];

export const MOCK_WORLD_FOLDERS: LibraryFolder[] = [
  {
    id: "active",
    name: "Active",
    items: [
      { name: "Novae",        hearts: 4, images: 6, coverImage: null },
      { name: "The Drift",    hearts: 2, images: 3, coverImage: null },
    ],
  },
  {
    id: "archived",
    name: "Archived",
    items: [
      { name: "Ember Hollow", hearts: 1, images: 2, coverImage: null },
      { name: "Ashveil",      hearts: 2, images: 1, coverImage: null },
    ],
  },
  {
    id: "wip",
    name: "Work in progress",
    items: [
      { name: "Pale Mirror",  hearts: 0, images: 3, coverImage: null },
      { name: "The Rift",     hearts: 1, images: 0, coverImage: null },
    ],
  },
];

// Full pool — used for the "add to featured" picker
export const ALL_MOCK_CHARACTERS = [
  ...MOCK_PROFILE.characters,
  { name: "Nova",    hearts: 6, images: 4, coverImage: null },
  { name: "Echo",    hearts: 2, images: 5, coverImage: null },
  { name: "Vesper",  hearts: 3, images: 1, coverImage: null },
  { name: "Solace",  hearts: 0, images: 2, coverImage: null },
];

export const ALL_MOCK_WORLDS = [
  ...MOCK_PROFILE.worlds,
  { name: "Ashveil",     hearts: 2, images: 1, coverImage: null },
  { name: "Pale Mirror", hearts: 0, images: 3, coverImage: null },
  { name: "The Rift",    hearts: 1, images: 0, coverImage: null },
];

// ── Mock artworks ─────────────────────────────────────────────────────────────

export const MOCK_ARTWORKS: Artwork[] = [
  { id: 1, title: "Saphira in the forest",  image: null, hearts: 12, character: { numId: 1, slug: "saphira-aishi",         name: "Saphira Aishi",         avatar: null, owner: "aiidenaya"    }, aspectRatio: "3/4",  fill: "linear-gradient(160deg, #2d1b4e 0%, #6b3fa0 45%, #a97fd4 80%, #e8c9ff 100%)" },
  { id: 2, title: "Aiiden Mizune portrait", image: null, hearts: 8,  character: { numId: 2, slug: "aiiden-mizune",         name: "Aiiden Mizune",         avatar: null, owner: "aiidenaya"    }, aspectRatio: "1/1",  fill: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
  { id: 3, title: "Commission — Kira",      image: null, hearts: 24, character: { numId: 3, slug: "kira",                  name: "Kira",                  avatar: null, owner: "someone_else" }, aspectRatio: "4/5",  fill: "linear-gradient(180deg, #1a0533 0%, #4a1a7a 40%, #c86dd7 75%, #ffd6f5 100%)" },
  { id: 4, title: "Sketch dump",            image: null, hearts: 5,  character: null,                                                                                                             aspectRatio: "16/9", fill: "linear-gradient(120deg, #1c1c2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)" },
  { id: 5, title: "Commission — Lune",      image: null, hearts: 17, character: { numId: 4, slug: "lune",                  name: "Lune",                  avatar: null, owner: "someone_else" }, aspectRatio: "2/3",  fill: "linear-gradient(170deg, #0d0221 0%, #261447 35%, #7b2d8b 65%, #f5a7e8 100%)" },
  { id: 6, title: "Summer vibes",           image: null, hearts: 9,  character: { numId: 5, slug: "name-of-the-character", name: "Name of the character", avatar: null, owner: "aiidenaya"    }, aspectRatio: "3/4",  fill: "linear-gradient(145deg, #1a1a2e 0%, #16213e 30%, #e94560 70%, #f5a623 100%)" },
];
