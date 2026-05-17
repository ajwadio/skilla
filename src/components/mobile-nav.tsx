"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Zap, BarChart2, Trophy, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Start", href: "/start", icon: Zap },
  { label: "Progress", href: "/progress", icon: BarChart2 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Notifications", href: "/notifications", icon: Bell },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80 px-2 pb-safe pt-1">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center w-16 gap-1 transition-colors",
              active ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Icon className="size-5" />
            <span className="text-[9px] font-medium tracking-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
