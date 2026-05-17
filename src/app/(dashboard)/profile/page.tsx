import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Zap,
  BookOpen,
  Clock3,
  Users,
  Target,
  Calendar,
} from "lucide-react";
import { FriendshipButton } from "./friendship-button";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatJoinDate(date: Date): string {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileSession = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  createdAt: Date;
};

/** Discriminated union describing the relationship from viewer → subject */
export type FriendshipState =
  | { kind: "self" }
  | { kind: "none" }
  | { kind: "pending_sent" }
  | { kind: "accepted" };

// ─── Sub-components ──────────────────────────────────────────────────────────

function MiniStatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-5 py-3 min-w-[90px]">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-orange-400" />
        <span className="text-sm font-black text-zinc-100 tabular-nums">
          {value}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </span>
    </div>
  );
}

function PersonalSessionCard({ session }: { session: ProfileSession }) {
  const { title, description, duration, createdAt } = session;

  return (
    <article className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/30">
      {/* Left accent bar */}
      <span className="absolute left-0 top-4 h-8 w-0.5 rounded-r-full bg-orange-500/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
          <p className="text-sm font-semibold leading-snug text-zinc-100 truncate">
            {title}
          </p>
        </div>

        {/* Duration badge */}
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-400">
          <Zap className="size-3" />
          {duration}m focus
        </span>
      </div>

      {/* Optional description */}
      {description && (
        <p className="mt-2 ml-5.5 text-sm leading-relaxed text-zinc-400 line-clamp-2">
          {description}
        </p>
      )}

      {/* Timestamp */}
      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-600">
        <Clock3 className="size-3 shrink-0" />
        <time dateTime={createdAt.toISOString()} title={formatDateTime(createdAt)}>
          {timeAgo(createdAt)} · {formatDateTime(createdAt)}
        </time>
      </div>
    </article>
  );
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-8 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
        <Zap className="size-5 text-orange-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-200">No sessions yet</p>
        <p className="text-xs text-zinc-500">
          Head over to{" "}
          <a href="/start" className="font-semibold text-orange-400 hover:underline">
            /start
          </a>{" "}
          to log your first focus milestone.
        </p>
      </div>
    </div>
  );
}

// ─── Root Page (React Server Component) ──────────────────────────────────────

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string }>;
}) {
  // 1. Auth guard
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // 2. Resolve the logged-in user's internal DB record
  const loggedInUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { id: true },
  });
  if (!loggedInUser) redirect("/onboarding");

  // 3. Determine which profile to show: ?username=... or own profile
  const { username: queryUsername } = await searchParams;
  const viewingOtherUser =
    queryUsername && queryUsername.trim().length > 0;

  let profileUser: {
    id: string;
    name: string;
    username: string;
    role: string;
    profilePic: string | null;
    goals: string[];
    createdAt: Date;
    friendIds: string[];
    studySessions: ProfileSession[];
  } | null;

  if (viewingOtherUser) {
    profileUser = await prisma.user.findUnique({
      where: { username: queryUsername!.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        profilePic: true,
        goals: true,
        createdAt: true,
        friendIds: true,
        studySessions: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // User not found — fall back to own profile
    if (!profileUser) redirect("/profile");
  } else {
    profileUser = await prisma.user.findUnique({
      where: { id: loggedInUser.id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        profilePic: true,
        goals: true,
        createdAt: true,
        friendIds: true,
        studySessions: {
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profileUser) redirect("/onboarding");
  }

  // 4. Compute friendship state when viewing someone else
  let friendshipState: FriendshipState = { kind: "self" };

  if (viewingOtherUser && profileUser.id !== loggedInUser.id) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: loggedInUser.id, receiverId: profileUser.id },
          { senderId: profileUser.id, receiverId: loggedInUser.id },
        ],
      },
      select: { status: true, senderId: true },
    });

    if (!friendship) {
      friendshipState = { kind: "none" };
    } else if (friendship.status === "ACCEPTED") {
      friendshipState = { kind: "accepted" };
    } else {
      // PENDING — check whether *we* sent it or they did
      // Only block if we sent it; if they sent it we could accept, but
      // per spec only "Requested ⚡" is needed for pending state regardless of direction
      friendshipState = { kind: "pending_sent" };
    }
  }

  const {
    name,
    username,
    role,
    profilePic,
    goals,
    createdAt,
    friendIds,
    studySessions,
  } = profileUser;

  const isSelf = !viewingOtherUser || profileUser.id === loggedInUser.id;
  const friendCount = friendIds.length;
  const sessionCount = studySessions.length;
  const totalMinutes = studySessions.reduce((acc, s) => acc + s.duration, 0);

  // Avatar — prefer stored URL, fall back to Dicebear
  const avatarUrl =
    profilePic ||
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(username)}`;

  return (
    <div className="mx-auto w-full max-w-2xl pb-12">
      {/* ════════════════════════════════════════════════════
          BANNER + AVATAR HEADER CARD
      ════════════════════════════════════════════════════ */}
      <div className="relative">
        {/* ── Gradient Banner ── */}
        <div className="h-36 w-full rounded-b-none rounded-t-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-orange-950/50 overflow-hidden">
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(249,115,22,0.12),transparent_60%)]" />
          {/* Decorative grid lines */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* ── Avatar — overlaps banner bottom edge ── */}
        <div className="absolute -bottom-14 left-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt={name}
            className="h-28 w-28 rounded-full border-4 border-zinc-950 object-cover shadow-xl shadow-black/50"
          />
          {/* Small role badge pinned bottom-right of avatar */}
          <span className="absolute bottom-1 right-0 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
            {role}
          </span>
        </div>
      </div>

      {/* ── Bio block (sits below the banner, gives avatar room) ── */}
      <div className="mt-16 px-6 pb-5 border-b border-zinc-800/60">
        {/* Name + handle row + CTA */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-zinc-100">
              {name}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-orange-500">
              @{username}
            </p>
          </div>

          {/* ── Friendship CTA — only rendered when viewing another user ── */}
          {!isSelf && (
            <div className="shrink-0 mt-1">
              <FriendshipButton
                state={friendshipState}
                targetUsername={username}
                targetUserId={profileUser.id}
              />
            </div>
          )}
        </div>

        {/* Friends + matchmaking note */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-zinc-600" />
            <span>
              <span className="font-bold text-zinc-300">{friendCount}</span>{" "}
              {friendCount === 1 ? "friend" : "friends"}
            </span>
          </div>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600 italic">
            Classic Matchmaking — Mutual request architecture
          </span>
        </div>

        {/* Joined date */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
          <Calendar className="size-3 shrink-0" />
          <span>Joined {formatJoinDate(createdAt)}</span>
        </div>

        {/* ── Stat pills row ── */}
        <div className="mt-5 flex flex-wrap gap-2.5">
          <MiniStatPill
            icon={Zap}
            label="Sessions"
            value={String(sessionCount)}
          />
          <MiniStatPill
            icon={Clock3}
            label="Focus Time"
            value={formatMinutes(totalMinutes)}
          />
          <MiniStatPill
            icon={Users}
            label="Friends"
            value={String(friendCount)}
          />
        </div>

        {/* ── Goals ── */}
        {goals.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center gap-2 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              <Target className="size-3" />
              Focus Goals
            </div>
            <div className="flex flex-wrap gap-2">
              {goals.map((goal, i) => (
                <span
                  key={i}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-400"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          PERSONAL ACTIVITY TIMELINE
      ════════════════════════════════════════════════════ */}
      <div className="px-4 pt-6 space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
            <BookOpen className="size-3.5" />
            Activity Timeline
          </div>
          {sessionCount > 0 && (
            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-semibold text-zinc-500">
              {sessionCount} post{sessionCount === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* Cards or empty state */}
        {studySessions.length === 0 ? (
          <EmptyTimeline />
        ) : (
          studySessions.map((session) => (
            <PersonalSessionCard key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}
