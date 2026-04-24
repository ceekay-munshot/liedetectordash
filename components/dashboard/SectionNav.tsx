const links: { id: string; label: string }[] = [
  { id: "company-scope", label: "A · Company & Scope" },
  { id: "source-register", label: "B · Sources" },
  { id: "missing-sources", label: "C · Gaps" },
  { id: "walk-the-talk", label: "D · Tracking" },
  { id: "scorecard", label: "E · Scorecard" },
  { id: "trend", label: "F · Trend" },
  { id: "root-cause", label: "G · Root Cause" },
  { id: "red-flags", label: "H · Red Flags" },
  { id: "investor-checklist", label: "I · Checklist" },
];

export function SectionNav() {
  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-0 z-20 border-b border-ink-200 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 py-2 text-xs">
        {links.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className="whitespace-nowrap rounded-full px-3 py-1 font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
