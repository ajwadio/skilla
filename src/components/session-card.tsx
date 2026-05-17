"use client";

import { useState, useTransition } from "react";
import { Zap, BookOpen, Clock3 } from "lucide-react";
import Link from "next/link";
import { toggleKudosAction, addCommentAction } from "@/app/(dashboard)/home/actions";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function Avatar({
  name,
  username,
  profilePic,
  size = "md",
}: {
  name: string;
  username: string;
  profilePic: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "size-8" : "size-10";
  const avatarUrl =
    profilePic ||
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(
      username
    )}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={name}
      className={`${dim} rounded-full object-cover ring-2 ring-zinc-800`}
    />
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type FeedSession = {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  createdAt: Date;
  kudosIds: string[];
  user: {
    name: string;
    username: string;
    profilePic: string | null;
    role: string;
    goals: string[];
    _count: {
      studySessions: number;
    };
    studySessions: {
      duration: number;
    }[];
  };
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      name: string;
      username: string;
      profilePic: string | null;
    };
  }[];
};

export function SessionCard({
  session,
  currentUserId,
}: {
  session: FeedSession;
  currentUserId: string;
}) {
  const { user, title, description, duration, createdAt, kudosIds, comments } = session;

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasLiked = kudosIds.includes(currentUserId);
  const kudosCount = kudosIds.length;
  const commentsCount = comments.length;

  const handleKudos = () => {
    startTransition(() => {
      toggleKudosAction(session.id);
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    startTransition(() => {
      addCommentAction(session.id, commentText);
      setCommentText("");
    });
  };

  const handleShare = async () => {
    const link = window.location.origin + "/home";
    try {
      await navigator.clipboard.writeText(link);
      setToastMessage("Link copied to clipboard! 🔗");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <article className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/30">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-zinc-800 px-4 py-2 text-sm font-medium text-orange-400 shadow-xl transition-all">
          {toastMessage}
        </div>
      )}

      {/* Subtle left accent bar */}
      <span className="absolute left-0 top-4 h-8 w-0.5 rounded-r-full bg-orange-500/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* ── Header row ── */}
      <div className="flex items-start justify-between gap-3">
        <HoverCard openDelay={10} closeDelay={100}>
          <HoverCardTrigger asChild>
            <Link href={`/profile?username=${user.username}`} className="flex items-start gap-3 hover:opacity-80 transition-opacity min-w-0">
              <Avatar name={user.name} username={user.username} profilePic={user.profilePic} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 hover:underline decoration-zinc-500 underline-offset-4">
                  <span className="text-sm font-bold text-zinc-100">{user.name}</span>
                  <span className="text-xs text-zinc-500">@{user.username}</span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Clock3 className="size-3 shrink-0" />
                  <time
                    dateTime={new Date(createdAt).toISOString()}
                    title={formatDateTime(createdAt)}
                  >
                    {timeAgo(createdAt)} · {formatDateTime(createdAt)}
                  </time>
                </div>
              </div>
            </Link>
          </HoverCardTrigger>
          <HoverCardContent className="bg-zinc-900 border-zinc-800 text-zinc-100 p-4 rounded-xl shadow-xl w-72">
            <div className="flex items-center gap-4">
              <Avatar name={user.name} username={user.username} profilePic={user.profilePic} size="md" />
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-sm font-bold truncate text-zinc-100">{user.name}</h4>
                <p className="text-xs text-zinc-500 truncate">@{user.username}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2 text-xs text-zinc-300">
              <p>
                <span className="font-semibold text-zinc-400">Total Output:</span>{" "}
                {user.studySessions.reduce((acc, s) => acc + s.duration, 0)} minutes logged
              </p>
              <p>
                <span className="font-semibold text-zinc-400">Velocity:</span>{" "}
                {user._count.studySessions} sessions completed
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800/60">
              <p className="text-xs font-medium text-orange-500 flex items-center gap-1.5">
                <span>🎯</span> {user.goals && user.goals.length > 0 ? `Goal: ${user.goals[0]}` : `Role: ${user.role}`}
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Duration badge */}
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-400">
          <Zap className="size-3" />
          {duration}m focus
        </span>
      </div>

      {/* ── Body ── */}
      <div className="mt-3.5 space-y-1 pl-13">
        <div className="flex items-start gap-2">
          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-zinc-600" />
          <p className="text-sm font-semibold leading-snug text-zinc-100">
            {title}
          </p>
        </div>

        {description && (
          <p className="ml-5.5 text-sm leading-relaxed text-zinc-400 line-clamp-3">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 h-px bg-zinc-800/40" />

      {/* ── Action row ── */}
      <div className="mt-3 flex items-center gap-1 pl-1">
        <button
          onClick={handleKudos}
          type="button"
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-zinc-800/60 ${
            hasLiked ? "text-orange-500" : "text-zinc-500 hover:text-orange-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={hasLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
          {kudosCount > 0 ? `${kudosCount} Kudos` : "Kudos"}
        </button>
        <button
          onClick={() => setIsCommentsOpen(!isCommentsOpen)}
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
        >
          <span>💬</span>
          {commentsCount > 0 ? `${commentsCount} Comments` : "Comment"}
        </button>
        <button
          onClick={handleShare}
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800/60 hover:text-zinc-300"
        >
          <span>🔗</span>
          Share
        </button>
      </div>

      {/* ── Comments Section ── */}
      {isCommentsOpen && (
        <div className="mt-4 border-t border-zinc-800/60 pt-4">
          {/* Comments List */}
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
            {comments.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5 items-start">
                  <Avatar name={comment.user.name} username={comment.user.username} profilePic={comment.user.profilePic} size="sm" />
                  <div className="flex-1 rounded-xl bg-zinc-800/40 px-3 py-2">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <span className="text-xs font-bold text-zinc-200">@{comment.user.username}</span>
                      <span className="text-[10px] text-zinc-600">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isPending}
              className="flex-1 rounded-full bg-zinc-800/50 px-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all border border-zinc-700/50"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isPending}
              className="rounded-full bg-orange-500 p-2 text-white shadow-md shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
