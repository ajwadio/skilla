"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Home, Zap, BarChart2, LogOut, User, ChevronUp, Bell, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarProps {
  /** @username from our MongoDB User document */
  username: string;
  /** Role label: Student | Working Professional | Other */
  role: string;
  /** Optional avatar URL from our DB */
  profilePic?: string | null;
}

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Start", href: "/start", icon: Zap },
  { label: "Progress", href: "/progress", icon: BarChart2 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Notifications", href: "/notifications", icon: Bell },
] as const;

export function Sidebar({ username, role, profilePic }: SidebarProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();

  const displayUsername = username || user?.username || user?.firstName || "username";
  const displayProfilePic = profilePic || user?.imageUrl || `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(displayUsername)}`;

  return (
    <aside className="relative flex h-screen w-64 shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-950 px-3 py-5">
      {/* ── Brand ── */}
      <div className="mb-8 px-3">
        <span className="text-2xl font-black tracking-widest text-orange-500">
          SKILLA
        </span>
      </div>

      {/* ── Nav ── */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-orange-500/10 text-orange-400"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-orange-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-orange-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Profile Segment ── */}
      <div className="relative mt-auto border-t border-zinc-800/50 pt-3">
        {/* Popover panel — renders above the trigger */}
        {profileOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900 shadow-2xl shadow-black/40">
            <Link
              href="/profile"
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
            >
              <User className="size-4 text-zinc-500" />
              View Profile
            </Link>
            <button
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-800/60 hover:text-red-400"
              onClick={() => {
                setProfileOpen(false);
                signOut({ redirectUrl: "/sign-in" });
              }}
            >
              <LogOut className="size-4 text-zinc-500" />
              Log out
            </button>
          </div>
        )}

        {/* Trigger button — clicking here must NEVER navigate the main panel */}
        <button
          id="sidebar-profile-trigger"
          type="button"
          onClick={() => setProfileOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/60"
        >
          {/* Avatar — dynamic adventurer-neutral avatar or real pic */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayProfilePic}
            alt={displayUsername}
            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-orange-500/40"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-zinc-100">
              @{displayUsername}
            </p>
            <p className="truncate text-[10px] text-zinc-500">{role}</p>
          </div>

          <ChevronUp
            className={cn(
              "size-4 shrink-0 text-zinc-500 transition-transform duration-200",
              profileOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
