import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body } = await req.json() as { title?: string; body?: string };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: "GitHub token not configured" }, { status: 500 });

  const username = (session.user as Record<string, unknown>).username as string | undefined ?? session.user.email;

  const res = await fetch("https://api.github.com/repos/AiidenAya/Novae.at/issues", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title: title?.trim() ?? `[Bug] reported by @${username}`,
      body: `**Reported by:** @${username}\n\n${body?.trim() ?? ""}`,
      labels: ["bug", "user-report"],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.message ?? "GitHub API error" }, { status: 500 });
  }

  const issue = await res.json();
  return NextResponse.json({ url: issue.html_url, number: issue.number });
}
