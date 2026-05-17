"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  Flame,
  FileText,
  Send,
} from "lucide-react";
import { postStudySession } from "./actions";

// ─── Constants ───────────────────────────────────────────────────────────────
const POMODORO_SECONDS = 25 * 60; // 25 minutes

// ─── Types ───────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  text: string;
  done: boolean;
}

type Mode = "active" | "post-session";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Circular SVG progress ring around the countdown */
function ProgressRing({
  progress,
  size = 220,
}: {
  progress: number; // 0-1
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#27272a"
        strokeWidth={stroke}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f97316"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

/** The 25-min countdown clock with play/pause/reset controls */
function PomodoroTimer({
  onFinish,
  elapsedMinutes,
}: {
  onFinish: () => void;
  elapsedMinutes: React.MutableRefObject<number>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // Timer hit zero — auto finish
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setRunning(false);
        // Store elapsed = full 25 min
        elapsedMinutes.current = 25;
        setTimeout(onFinish, 300);
        return 0;
      }
      return prev - 1;
    });
  }, [onFinish, elapsedMinutes]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, tick]);

  const handleReset = () => {
    setRunning(false);
    setSecondsLeft(POMODORO_SECONDS);
  };

  const handleFinish = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const elapsed = POMODORO_SECONDS - secondsLeft;
    elapsedMinutes.current = Math.max(1, Math.ceil(elapsed / 60));
    onFinish();
  };

  const progress = (POMODORO_SECONDS - secondsLeft) / POMODORO_SECONDS;
  const isComplete = secondsLeft === 0;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Ring + digits */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <ProgressRing progress={progress} />
        <div className="flex flex-col items-center z-10">
          <span className="text-5xl font-black tracking-tight text-zinc-100 tabular-nums">
            {formatTime(secondsLeft)}
          </span>
          <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {isComplete ? "Done!" : running ? "Focusing..." : "Paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center size-11 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-all"
          title="Reset"
        >
          <RotateCcw className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setRunning((v) => !v)}
          className="flex items-center justify-center size-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 transition-all active:scale-95"
          title={running ? "Pause" : "Play"}
        >
          {running ? (
            <Pause className="size-6" />
          ) : (
            <Play className="size-6 translate-x-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleFinish}
          className="flex items-center justify-center h-11 px-5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-orange-400 hover:border-orange-500/40 text-sm font-semibold transition-all gap-2"
        >
          <Flame className="size-4" />
          Finish Session
        </button>
      </div>
    </div>
  );
}

/** Inline editable checklist for daily task notes */
function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false },
    ]);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="w-full max-w-md space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
        <CheckSquare className="size-3.5 text-orange-500" />
        Session Tasks
        <span className="ml-auto text-zinc-700">
          {tasks.filter((t) => t.done).length}/{tasks.length}
        </span>
      </div>

      {/* Task rows */}
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="group flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5"
          >
            <button
              type="button"
              onClick={() => toggleTask(task.id)}
              className="shrink-0 text-zinc-600 hover:text-orange-500 transition-colors"
            >
              {task.done ? (
                <CheckSquare className="size-4 text-orange-500" />
              ) : (
                <Square className="size-4" />
              )}
            </button>
            <span
              className={`flex-1 text-sm transition-colors ${
                task.done
                  ? "line-through text-zinc-600"
                  : "text-zinc-200"
              }`}
            >
              {task.text}
            </span>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
            >
              <Trash2 className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-600">
          Add tasks to focus your session
        </div>
      )}

      {/* Add input */}
      <form onSubmit={addTask} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/20 transition-all"
        />
        <button
          type="submit"
          className="flex items-center justify-center size-10 rounded-xl bg-zinc-900 border border-zinc-800 text-orange-500 hover:bg-zinc-800 hover:border-orange-500/40 transition-all"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Post-session form — swaps in when Finish Session is clicked */
function PostSessionForm({
  defaultDuration,
}: {
  defaultDuration: number;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a session title before posting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await postStudySession({
        title: title.trim(),
        description: description.trim() || undefined,
        durationMinutes: defaultDuration,
      });
      // Server action redirects to /home on success
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to post session. Try again.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-5">
      {/* Header meta */}
      <div className="flex items-center gap-2.5 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
        <div className="flex items-center justify-center size-9 rounded-full bg-orange-500/10 border border-orange-500/20">
          <Clock className="size-4 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100">Session Complete</p>
          <p className="text-xs text-zinc-500">
            {defaultDuration} min focused · Share it with your network
          </p>
        </div>
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl"
          >
            <AlertCircle className="size-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-sm text-red-200">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title field */}
      <div className="space-y-1.5">
        <label
          htmlFor="session-title"
          className="block text-sm font-semibold text-zinc-300"
        >
          Session Title
          <span className="text-orange-500 ml-0.5">*</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3.5 top-3.5 size-4 text-zinc-500" />
          <input
            id="session-title"
            type="text"
            placeholder="What did you work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm"
          />
        </div>
      </div>

      {/* Description field */}
      <div className="space-y-1.5">
        <label
          htmlFor="session-description"
          className="block text-sm font-semibold text-zinc-300"
        >
          Description{" "}
          <span className="text-zinc-600 font-normal">(optional)</span>
        </label>
        <textarea
          id="session-description"
          rows={3}
          placeholder="Any notes, breakthroughs, or context to share…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm resize-none"
        />
        <p className="text-right text-[10px] text-zinc-700">
          {description.length}/300
        </p>
      </div>

      {/* Post button */}
      <button
        type="button"
        onClick={handlePost}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Posting to Feed…
          </>
        ) : (
          <>
            <Send className="size-4" />
            Post to Feed
          </>
        )}
      </button>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function StartPage() {
  const [mode, setMode] = useState<Mode>("active");
  const elapsedMinutes = useRef<number>(25);

  const handleFinishSession = () => {
    setMode("post-session");
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-start px-4 py-10">
      <AnimatePresence mode="wait">
        {mode === "active" ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-10 w-full"
          >
            {/* Section label */}
            <div className="text-center">
              <h1 className="text-xl font-black tracking-tight text-zinc-100">
                Focus Session
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                25-minute Pomodoro — stay locked in.
              </p>
            </div>

            <PomodoroTimer
              onFinish={handleFinishSession}
              elapsedMinutes={elapsedMinutes}
            />

            {/* Divider */}
            <div className="flex items-center gap-3 w-full max-w-md">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                Session Tasks
              </span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            <TaskList />
          </motion.div>
        ) : (
          <motion.div
            key="post-session"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-8 w-full"
          >
            {/* Section label */}
            <div className="text-center">
              <h1 className="text-xl font-black tracking-tight text-zinc-100">
                Log your Session
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Give it a title and share it with your network.
              </p>
            </div>

            <PostSessionForm defaultDuration={elapsedMinutes.current} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
