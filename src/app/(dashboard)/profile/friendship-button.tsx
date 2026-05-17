"use client";

import { useTransition } from "react";
import { sendFriendRequest } from "./actions";
import type { FriendshipState } from "./page";
import { UserPlus, Loader2 } from "lucide-react";

interface FriendshipButtonProps {
  state: FriendshipState;
  /** Username of the profile being viewed (used for sendFriendRequest) */
  targetUsername: string;
  /** Internal MongoDB ObjectId of the profile being viewed (reserved for future acceptFriendRequest) */
  targetUserId: string;
}

export function FriendshipButton({
  state,
  targetUsername,
}: FriendshipButtonProps) {
  const [isPending, startTransition] = useTransition();

  // ── "Friends 🤝" badge ────────────────────────────────────────────────────
  if (state.kind === "accepted") {
    return (
      <span
        className="
          inline-flex items-center gap-1.5 rounded-full
          border border-emerald-500/30 bg-emerald-500/10
          px-4 py-1.5 text-xs font-bold text-emerald-400
          select-none
        "
      >
        Friends 🤝
      </span>
    );
  }

  // ── "Requested ⚡" disabled button ────────────────────────────────────────
  if (state.kind === "pending_sent") {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="
          inline-flex cursor-not-allowed items-center gap-1.5 rounded-full
          border border-zinc-700/50 bg-zinc-800/60
          px-4 py-1.5 text-xs font-bold text-zinc-500
          select-none opacity-70
        "
      >
        Requested ⚡
      </button>
    );
  }

  // ── "Send Friend Request" orange button ───────────────────────────────────
  // state.kind === "none"
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await sendFriendRequest(targetUsername);
        })
      }
      className="
        inline-flex items-center gap-1.5 rounded-full
        border border-orange-500/40 bg-orange-500 hover:bg-orange-600
        px-4 py-1.5 text-xs font-bold text-white
        shadow-md shadow-orange-500/20
        transition-all duration-150
        active:scale-95
        disabled:cursor-not-allowed disabled:opacity-60
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50
      "
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <UserPlus className="size-3.5" />
      )}
      {isPending ? "Sending…" : "Send Friend Request"}
    </button>
  );
}
