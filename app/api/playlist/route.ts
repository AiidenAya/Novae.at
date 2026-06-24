import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const listId = url.match(/[?&]list=([^&]+)/)?.[1];
  if (!listId) return NextResponse.json({ error: "No playlist ID found in URL" }, { status: 400 });

  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?playlist_id=${listId}`,
    { headers: { "Accept": "application/xml, text/xml" } }
  );

  if (!res.ok) return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 502 });

  const xml = await res.text();

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  if (!entries.length) {
    return NextResponse.json({ error: "No tracks found — playlist may be private or empty" }, { status: 404 });
  }

  const tracks = entries.map((m) => {
    const block = m[1];
    const videoId = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? crypto.randomUUID();
    const title = block.match(/<media:title>([^<]+)<\/media:title>/)?.[1]
      ?? block.match(/<title>([^<]+)<\/title>/)?.[1]
      ?? "";
    const artist = block.match(/<author>\s*<name>([^<]+)<\/name>/)?.[1] ?? "";
    return { id: videoId, title: decodeXml(title), artist: decodeXml(artist) };
  }).filter(t => t.title);

  return NextResponse.json({ tracks });
}

function decodeXml(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
