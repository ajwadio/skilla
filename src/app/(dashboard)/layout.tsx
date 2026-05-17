import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { FloatingSearch } from "@/components/floating-search";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  title: "Skilla",
  description: "Track your study sessions, build streaks, grow together.",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve active Clerk session
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // Resolve MongoDB profile for sidebar display fields
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: { username: true, role: true, profilePic: true },
  });

  // Not yet onboarded — block dashboard access
  if (!dbUser) redirect("/onboarding");

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 relative">
      {/* ── Fixed Left Sidebar ── */}
      <Sidebar
        username={dbUser.username}
        role={dbUser.role}
        profilePic={dbUser.profilePic}
      />

      {/* ── Right Main Panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden md:pl-64 pb-20 md:pb-0">
        {/* Floating Search — pinned to top of right panel */}
        <header className="shrink-0 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm">
          <FloatingSearch />
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
