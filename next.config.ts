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
    // so the actual page lives at app/[username] and this rewrite maps the
    // public path onto it transparently.
    return [
      { source: "/~:username", destination: "/:username" },
    ];
  },
};

export default nextConfig;
