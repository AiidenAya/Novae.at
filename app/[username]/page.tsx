import { permanentRedirect } from "next/navigation";

// Any single-segment path that isn't a real top-level route (admin, browse,
// api, home, library, notifications, referrals, settings, ...) lands here —
// Next always matches those static routes first. Treat it as a legacy
// profile URL and redirect to the canonical /~username one.
export default async function LegacyUsernameRedirect({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  permanentRedirect(`/~${username}`);
}
