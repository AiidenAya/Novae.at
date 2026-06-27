import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./_client";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, type: true, read: true, createdAt: true,
      actor: { select: { id: true, username: true, name: true, avatar: true } },
      character: { select: { id: true, numId: true, slug: true, name: true, avatarUrl: true } },
      artwork: { select: { id: true, thumbnailUrl: true, imageUrl: true, title: true } },
    },
  });

  return <NotificationsClient notifications={notifications} />;
}
