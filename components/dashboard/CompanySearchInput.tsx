"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { BirdnestEntry } from "@/lib/muns/birdnest";

export interface CompanySearchInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (entry: BirdnestEntry) => void;
  className?: string;
}

const DEBOUNCE_MS = 200;

export function CompanySearchInput({
  label = "Company",
  placeholder = "e.g., Reliance Industries",
  value,
  onChange,
  onSelect,
  className,
}: CompanySearchInputProps) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [results, setResults] = useState<BirdnestEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);

  // Tracks the most recent query so out-of-order responses don't overwrite a
  // newer result set.
  const latestQueryRef = useRef("");

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      latestQueryRef.current = query;
      return;
    }

    latestQueryRef.current = query;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        const json = (await res.json()) as {
          results?: BirdnestEntry[];
          error?: string;
        };
        if (latestQueryRef.current !== query) return;
        if (!res.ok) {
          setResults([]);
          setError(json.error ?? `Search failed (${res.status})`);
        } else {
          setResults(json.results ?? []);
          setHighlight(0);
        }
      } catch (e) {
        if ((e as { name?: string }).name === "AbortError") return;
        setError(e instanceof Error ? e.message : String(e));
        setResults([]);
      } finally {
        if (latestQueryRef.current === query) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSelect = (entry: BirdnestEntry) => {
    onSelect(entry);
    setOpen(false);
  };

  const showDropdown = open && value.trim().length >= 2;
  const showEmpty = showDropdown && !loading && !error && results.length === 0;

  return (
    <div ref={containerRef} className={cn("relative block", className)}>
      <label className="block" htmlFor={inputId}>
        <span className="mb-1 block text-xs font-medium text-ink-600">
          {label}
        </span>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showDropdown || results.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              const picked = results[highlight];
              if (picked) handleSelect(picked);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-card transition-colors",
            "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/60",
          )}
        />
      </label>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-ink-200 bg-white shadow-card">
          {loading && (
            <div className="px-3 py-2 text-xs text-ink-500">Searching…</div>
          )}
          {error && (
            <div className="px-3 py-2 text-xs text-bad-500">{error}</div>
          )}
          {showEmpty && (
            <div className="px-3 py-2 text-xs text-ink-500">No matches.</div>
          )}
          {results.map((entry, i) => (
            <button
              key={`${entry.ticker}-${i}`}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(entry);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                i === highlight ? "bg-ink-50" : "bg-white",
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-ink-900">
                  {entry.name}
                </div>
                <div className="truncate text-[11px] text-ink-500">
                  {entry.industry || "—"}
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-ink-100 px-2 py-0.5 font-mono text-[11px] tracking-wide text-ink-700">
                {entry.ticker}
                {entry.country ? ` · ${entry.country}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
