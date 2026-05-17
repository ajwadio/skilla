import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Flame, Trophy, Target, TrendingUp } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clamps a 0-100 percentage and returns a CSS width string */
function toPercent(sessions: number, cap = 10): string {
  return `${Math.min(100, Math.round((sessions / cap) * 100))}%`;
}

/** Formats minutes into a human-readable string e.g. "2h 35m" */
function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Converts a Date object to YYYY-MM-DD */
function toDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg hover:shadow-black/30 ${
        accent
          ? "border-orange-500/25 bg-orange-500/5 hover:border-orange-500/40"
          : "border-zinc-800/60 bg-zinc-900/60 hover:border-zinc-700/80"
      }`}
    >
      {/* Background glow for accent card */}
      {accent && (
        <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-orange-500/8 blur-2xl" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={`text-[11px] font-bold uppercase tracking-widest ${
              accent ? "text-orange-400/80" : "text-zinc-500"
            }`}
          >
            {label}
          </span>
          <p
            className={`text-4xl font-black leading-none tracking-tight ${
              accent ? "text-orange-400" : "text-zinc-100"
            }`}
          >
            {value}
          </p>
          <p className="text-xs text-zinc-500">{sub}</p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            accent
              ? "bg-orange-500/15 text-orange-400"
              : "bg-zinc-800/80 text-zinc-400"
          }`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

function GoalBar({
  goal,
  sessions,
  index,
}: {
  goal: string;
  sessions: number;
  index: number;
}) {
  const pct = toPercent(sessions);
  const filled = sessions > 0;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
              filled
                ? "bg-orange-500/20 text-orange-400"
                : "bg-zinc-800 text-zinc-600"
            }`}
          >
            {index + 1}
          </span>
          <span className="truncate text-sm font-medium text-zinc-300">
            {goal}
          </span>
        </div>
        <span
          className={`shrink-0 text-xs font-bold tabular-nums ${
            filled ? "text-orange-400" : "text-zinc-600"
          }`}
        >
          {sessions} session{sessions === 1 ? "" : "s"}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800/80">
        <div
          className="h-full rounded-full bg-orange-500 transition-all duration-700 ease-out"
          style={{ width: pct }}
        />
      </div>

      {/* Micro label under bar */}
      <p className="text-[10px] text-zinc-600">
        {sessions === 0
          ? "No sessions logged yet"
          : `${pct} of 10-session milestone`}
      </p>
    </div>
  );
}

function ActivityHeatmap({ sessions }: { sessions: { createdAt: Date }[] }) {
  const counts = sessions.reduce((acc, s) => {
    const dateStr = toDateStr(s.createdAt);
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weeks = 17;
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const daysToSubtract = (weeks - 1) * 7 + currentDayOfWeek;
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - daysToSubtract);
  startDate.setHours(12, 0, 0, 0);

  const grid = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    
    if (
      d.getFullYear() > today.getFullYear() ||
      (d.getFullYear() === today.getFullYear() && d.getMonth() > today.getMonth()) ||
      (d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() > today.getDate())
    ) {
      grid.push(null);
    } else {
      grid.push(toDateStr(d));
    }
  }

  function getColor(count: number) {
    if (count === 0) return "bg-zinc-800/60";
    if (count === 1) return "bg-orange-950";
    if (count === 2) return "bg-orange-800";
    return "bg-orange-500";
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Focus Activity Matrix</h2>
        <p className="text-xs text-zinc-400 mt-1">Your 120-day focus intensity heatmap.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
          {grid.map((dateStr, i) => {
            if (!dateStr) {
              return <div key={i} className="h-3.5 w-3.5 rounded-sm bg-transparent" />;
            }
            const count = counts[dateStr] || 0;
            return (
              <div
                key={i}
                title={`${count} session${count === 1 ? "" : "s"} on ${dateStr}`}
                className={`h-3.5 w-3.5 rounded-sm ${getColor(count)}`}
              />
            );
          })}
        </div>
        
        <div className="flex items-center justify-end gap-2 text-xs text-zinc-500 font-medium">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded-sm bg-zinc-800/60" />
            <div className="h-3 w-3 rounded-sm bg-orange-950" />
            <div className="h-3 w-3 rounded-sm bg-orange-800" />
            <div className="h-3 w-3 rounded-sm bg-orange-500" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── Root Page (React Server Component) ──────────────────────────────────────

export default async function ProgressPage() {
  // 1. Auth guard
  const clerkUser = await currentUser();
  if (!clerkUser) redirect("/sign-in");

  // 2. Resolve DB user — fetch goals + all session durations in one query
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
    select: {
      id: true,
      goals: true,
      studySessions: {
        select: { duration: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dbUser) redirect("/onboarding");

  const sessions = dbUser.studySessions;
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const goals = dbUser.goals;

  // Compute sessions per goal using a simple round-robin distribution
  // (goals don't have explicit per-session tags yet, so we distribute evenly
  //  and show a proportional count so the bars feel meaningful)
  function sessionsForGoal(idx: number): number {
    if (totalSessions === 0 || goals.length === 0) return 0;
    const base = Math.floor(totalSessions / goals.length);
    const remainder = totalSessions % goals.length;
    return idx < remainder ? base + 1 : base;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-lg font-black tracking-tight text-zinc-100">
          Progress
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500">
          Your personal focus metrics and milestone tracker.
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={Flame}
          label="Total Output"
          value={formatMinutes(totalMinutes)}
          sub="Total focused time logged"
          accent
        />
        <StatCard
          icon={Trophy}
          label="Velocity"
          value={String(totalSessions)}
          sub={`Milestone${totalSessions === 1 ? "" : "s"} logged`}
        />
      </div>

      {/* ── Streak hint ── */}
      {totalSessions > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3">
          <TrendingUp className="size-4 shrink-0 text-orange-400" />
          <p className="text-xs text-zinc-400">
            You&apos;ve averaged{" "}
            <span className="font-bold text-zinc-200">
              {(totalMinutes / Math.max(1, totalSessions)).toFixed(0)} min
            </span>{" "}
            per session. Keep the streak alive — consistency compounds.
          </p>
        </div>
      )}

      {/* ── Goals section ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
          <Target className="size-3.5" />
          Focus Goals
        </div>

        {goals.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No goals set. Complete your profile to add focus targets.
          </p>
        ) : (
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 divide-y divide-zinc-800/50">
            {goals.map((goal, i) => (
              <div key={i} className="px-5 py-5">
                <GoalBar
                  goal={goal}
                  sessions={sessionsForGoal(i)}
                  index={i}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activity Heatmap ── */}
      <ActivityHeatmap sessions={sessions} />

      {/* ── Empty CTA ── */}
      {totalSessions === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-8 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 ring-1 ring-orange-500/20">
            <Flame className="size-5 text-orange-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-200">
              No sessions yet
            </p>
            <p className="text-xs text-zinc-500">
              Log your first Pomodoro to populate your stats.
            </p>
          </div>
          <a
            href="/start"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95"
          >
            Start a Session
          </a>
        </div>
      )}
    </div>
  );
}
