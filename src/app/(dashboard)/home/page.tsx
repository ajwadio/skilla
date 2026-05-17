import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Zap, Rocket } from "lucide-react";
import { SessionCard } from "@/components/session-card";

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-8 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
        <Rocket className="size-7 text-orange-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-bold text-zinc-100">
          Your feed is empty
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
          No activity yet. Use the{" "}
          <span className="font-semibold text-orange-400">search bar above</span>{" "}
          to find friends, or head to{" "}
          <span className="font-semibold text-orange-400">/start</span>{" "}
          to log your first Pomodoro session.
        </p>
      </div>

      <a
        href="/start"
        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
      >
        <Zap className="size-4" />
        Start a Session
      </a>
    </div>
  );
}

// ─── Feed label ───────────────────────────────────────────────────────────────

function FeedHeader({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-black tracking-tight text-zinc-100">
          Activity Feed
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          {count > 0
            ? `${count} session${count === 1 ? "" : "s"} logged`
            : "Be the first to log a session"}
        </p>
      </div>

      {count > 0 && (
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-semibold text-zinc-400">
          {count} post{count === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}

// ─── Root Page (React Server Component) ──────────────────────────────────────

export default async function HomePage() {
  // 1. Resolve the active Clerk session
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // 2. Resolve our internal User document from Clerk identity
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });

  // Not yet onboarded — send them through the wizard
  if (!dbUser) redirect("/onboarding");

  // 3. Pull ACCEPTED friend IDs directly from the Friendship model so the
  //    feed is always authoritative, even if friendIds ever drifts out of sync.
  const acceptedFriendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: dbUser.id },
        { receiverId: dbUser.id },
      ],
    },
    select: { senderId: true, receiverId: true },
  });

  // Derive the set of peer IDs (the other side of each mutual row)
  const friendIds = acceptedFriendships.map((f) =>
    f.senderId === dbUser.id ? f.receiverId : f.senderId
  );

  // Only include study sessions from users where a mutual "ACCEPTED" friendship row exists
  const visibleUserIds = friendIds;

  // 4. Fetch sessions, joining the author's profile fields
  const sessions = await prisma.studySession.findMany({
    where: {
      userId: { in: visibleUserIds },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // hard cap to keep initial load fast
    select: {
      id: true,
      title: true,
      description: true,
      duration: true,
      createdAt: true,
      kudosIds: true,
      user: {
        select: {
          name: true,
          username: true,
          profilePic: true,
          role: true,
          goals: true,
          _count: {
            select: { studySessions: true },
          },
          studySessions: {
            select: { duration: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              username: true,
              profilePic: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <FeedHeader count={sessions.length} />

      <div className="mt-6 space-y-4">
        {sessions.length === 0 ? (
          <EmptyFeed />
        ) : (
          sessions.map((session) => (
            <SessionCard key={session.id} session={session} currentUserId={dbUser.id} />
          ))
        )}
      </div>
    </div>
  );
}
