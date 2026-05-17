import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  // Query all users and their associated study sessions
  const users = await prisma.user.findMany({
    select: {
      username: true,
      name: true,
      profilePic: true,
      studySessions: {
        select: {
          duration: true,
        },
      },
    },
  });

  const activeCommunityCount = users.length;

  // Calculate total focus time and sort descending
  const rankedUsers = users
    .map((user) => {
      const totalMinutes = user.studySessions.reduce(
        (acc, session) => acc + session.duration,
        0
      );
      return {
        ...user,
        totalMinutes,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 100); // Top 100 accounts

  function formatTime(minutes: number) {
    if (minutes < 60) {
      return `${minutes} mins`;
    }
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hours`;
  }

  function getRankBadge(rank: number) {
    if (rank === 1) {
      return <Trophy className="size-6 text-yellow-500 fill-yellow-500/20" title="1st Place" />;
    }
    if (rank === 2) {
      return <Medal className="size-6 text-zinc-400 fill-zinc-400/20" title="2nd Place" />;
    }
    if (rank === 3) {
      return <Medal className="size-6 text-amber-600 fill-amber-600/20" title="3rd Place" />;
    }
    return <span className="text-sm font-bold text-zinc-500 w-6 text-center">{rank}</span>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 bg-zinc-950 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-zinc-100">Global Standings</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Tracking focus execution across {activeCommunityCount} community members.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-1">
        <div className="divide-y divide-zinc-800/50">
          {rankedUsers.map((user, index) => {
            const rank = index + 1;
            const displayProfilePic =
              user.profilePic ||
              `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(
                user.username
              )}`;

            return (
              <Link
                key={user.username}
                href={`/profile?username=${user.username}`}
                className="group flex items-center justify-between gap-4 px-5 py-4 transition-all hover:bg-zinc-800/40 cursor-pointer"
              >
                <div className="flex items-center gap-5">
                  <div className="flex w-8 items-center justify-center shrink-0">
                    {getRankBadge(rank)}
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayProfilePic}
                    alt={user.name}
                    className="size-10 rounded-full object-cover ring-1 ring-zinc-800 group-hover:ring-orange-500/50 transition-all"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">@{user.username}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-black text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 shadow-sm shadow-orange-500/5">
                    {formatTime(user.totalMinutes)}
                  </p>
                </div>
              </Link>
            );
          })}

          {rankedUsers.length === 0 && (
            <div className="py-12 text-center text-sm text-zinc-500">
              No focus data available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
