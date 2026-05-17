"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

type SearchUser = {
  username: string;
  name: string;
  profilePic: string | null;
  role: string;
};

export function FloatingSearch() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced fetch ────────────────────────────────────────────────────────
  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/search-users?q=${encodeURIComponent(q.trim())}`
      );
      if (res.ok) {
        const data: SearchUser[] = await res.json();
        setResults(data);
        setOpen(true);
        setActiveIndex(-1);
      }
    } catch {
      // Silent fail — search is best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Navigate to profile ────────────────────────────────────────────────────
  function handleSelect(username: string) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/profile?username=${encodeURIComponent(username)}`);
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : i));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex].username);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="flex w-full items-center justify-center px-6 py-4">
      <div ref={containerRef} className="relative w-full max-w-md">
        {/* ── Input pill ── */}
        <div
          className="
            group flex w-full items-center gap-3
            rounded-full border border-zinc-800/50 bg-zinc-900/80
            px-4 py-2.5 shadow-lg shadow-black/30 backdrop-blur-sm
            transition-all duration-200
            focus-within:border-orange-500/40 focus-within:ring-2 focus-within:ring-orange-500/10
            hover:border-zinc-700/60
          "
        >
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-orange-400" />
          ) : (
            <Search className="size-4 shrink-0 text-zinc-500 transition-colors group-focus-within:text-orange-400" />
          )}
          <input
            id="floating-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search by username…"
            autoComplete="off"
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
              className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors text-xs"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Dropdown ── */}
        {open && (
          <div
            role="listbox"
            className="
              absolute left-0 right-0 top-full mt-2 z-50
              rounded-2xl border border-zinc-800/60 bg-zinc-900/95
              backdrop-blur-md shadow-2xl shadow-black/50
              overflow-hidden
            "
          >
            {results.length === 0 ? (
              <div className="px-4 py-5 text-center text-xs text-zinc-500">
                No users found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/40">
                {results.map((user, i) => {
                  const avatarUrl =
                    user.profilePic ||
                    `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(user.username)}`;
                  const isActive = i === activeIndex;

                  return (
                    <li
                      key={user.username}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(i)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      onClick={() => handleSelect(user.username)}
                      className={`
                        flex items-center gap-3 px-4 py-3 cursor-pointer
                        transition-colors duration-100
                        ${isActive ? "bg-zinc-800/70" : "hover:bg-zinc-800/40"}
                      `}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl}
                        alt={user.name}
                        className="size-8 rounded-full object-cover ring-2 ring-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          @{user.username}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
                        {user.role}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
