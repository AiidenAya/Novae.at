import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import LandingPage from "@/components/landing/LandingPage";

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  if (session?.user) redirect("/home");

  return <LandingPage />;
}
