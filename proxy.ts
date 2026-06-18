import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pages accessibles sans login (lecture publique)
const PUBLIC_PATTERNS = [
  /^\/library\/characters\/[^/]+$/,  // /library/characters/[id] — vue publique
];

const PROTECTED_PREFIXES = ["/library", "/settings"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicException = PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname));
  if (isPublicException) return NextResponse.next();

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/settings/:path*"],
};
