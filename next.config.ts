import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 80, 90],
    remotePatterns: [
      { protocol: "http",  hostname: "localhost" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
  async rewrites() {
    // Public profile URLs are /~username; a literal "~" in a route's folder
    // name isn't recognized as part of a dynamic segment by Next's router,
    // so the actual page lives at app/profile/[username] and this rewrite
    // maps the public path onto it. Rewriting straight to "/:username"
    // would collide with real top-level routes (e.g. /~admin -> /admin,
    // landing on the admin dashboard instead of a profile page), so the
    // destination is namespaced under /profile instead.
    return [
      { source: "/~:username", destination: "/profile/:username" },
    ];
  },
};

export default nextConfig;
