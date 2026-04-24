"use client";

import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  hint?: string;
  options: SelectOption[];
}

export function Select({
  label,
  hint,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <label className="block" htmlFor={selectId}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-ink-600">
          {label}
        </span>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full appearance-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-card transition-colors",
          "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/60",
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[11px] text-ink-500">{hint}</span>}
    </label>
  );
}
