import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Bell, Inbox } from "lucide-react";
import { NotificationItem } from "./notification-item";

function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-8 py-16 text-center mt-6">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-800/50 ring-1 ring-zinc-700/50">
        <Inbox className="size-7 text-zinc-500" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-bold text-zinc-100">
          Your inbox is completely clear
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
          Go track some focus milestones!
        </p>
      </div>
    </div>
  );
}

export default async function NotificationsPage() {
  // 1. Resolve Clerk Session
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // 2. Resolve DB User Identity
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  if (!dbUser) redirect("/onboarding");

  // 3. Fetch PENDING incoming friend requests
  const pendingRequests = await prisma.friendship.findMany({
    where: {
      receiverId: dbUser.id,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          profilePic: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-zinc-100" />
            <h1 className="text-lg font-black tracking-tight text-zinc-100">
              Notifications
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {pendingRequests.length === 0
              ? "You have 0 pending invitations"
              : `You have ${pendingRequests.length} pending invitation${
                  pendingRequests.length === 1 ? "" : "s"
                }`}
          </p>
        </div>
      </div>

      {/* ── Requests List ── */}
      {pendingRequests.length === 0 ? (
        <EmptyInbox />
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <NotificationItem
              key={req.id}
              senderId={req.sender.id}
              username={req.sender.username}
              profilePic={req.sender.profilePic}
              createdAt={req.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
