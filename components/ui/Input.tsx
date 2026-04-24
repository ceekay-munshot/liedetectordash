"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-ink-600">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-card transition-colors",
          "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/60",
          className,
        )}
        {...props}
      />
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  );
}
