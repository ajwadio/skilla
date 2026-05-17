"use client";

import { useTransition } from "react";
import { acceptFriendRequest, declineFriendRequest } from "../profile/actions";
import { Check, X, Loader2, Clock3 } from "lucide-react";

interface NotificationItemProps {
  senderId: string;
  username: string;
  profilePic: string | null;
  createdAt: Date;
}

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationItem({
  senderId,
  username,
  profilePic,
  createdAt,
}: NotificationItemProps) {
  const [isAccepting, startAcceptTransition] = useTransition();
  const [isDeclining, startDeclineTransition] = useTransition();

  const isPending = isAccepting || isDeclining;

  const avatarUrl =
    profilePic ||
    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(username)}`;

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-4 transition-all duration-200 hover:border-zinc-700/80 hover:bg-zinc-900/90">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={username}
          className="size-10 rounded-full object-cover ring-2 ring-zinc-800"
        />
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-zinc-100">@{username}</p>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
            <Clock3 className="size-3" />
            <span>Sent {timeAgo(createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Accept Button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startAcceptTransition(async () => {
              await acceptFriendRequest(senderId);
            })
          }
          className="
            inline-flex items-center gap-1.5 rounded-lg
            bg-orange-500 hover:bg-orange-600
            px-3 py-2 text-xs font-bold text-white
            shadow-md shadow-orange-500/20
            transition-all duration-150
            active:scale-95
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {isAccepting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          Accept
        </button>

        {/* Decline Button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startDeclineTransition(async () => {
              await declineFriendRequest(senderId);
            })
          }
          className="
            inline-flex items-center gap-1.5 rounded-lg
            border border-zinc-700/50 bg-zinc-800/60 hover:bg-zinc-800
            px-3 py-2 text-xs font-bold text-zinc-300 hover:text-zinc-100
            transition-all duration-150
            active:scale-95
            disabled:cursor-not-allowed disabled:opacity-60
          "
        >
          {isDeclining ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <X className="size-3.5" />
          )}
          Decline
        </button>
      </div>
    </article>
  );
}
