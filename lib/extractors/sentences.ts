// Pragmatic sentence splitter. We'd use a real one in production but for
// regex-driven extraction this is sufficient.

const ABBREV = new Set([
  "mr", "mrs", "ms", "dr", "shri", "smt", "sr", "jr", "rs", "no", "p", "pp",
  "vs", "etc", "i.e", "e.g", "fig", "ph.d", "u.s", "u.k",
]);

export function splitSentences(text: string): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/\r/g, " ")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();

  const out: string[] = [];
  let buf = "";
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    buf += c;
    if (c === "." || c === "?" || c === "!") {
      const next = cleaned[i + 1];
      if (next === "." || /\d/.test(cleaned[i - 1] || "")) continue;
      const lastWord = (buf.match(/(\b[\w.]+)\.$/)?.[1] ?? "").toLowerCase();
      if (lastWord && ABBREV.has(lastWord.replace(/\.$/, ""))) continue;
      if (next && next !== " ") continue;
      out.push(buf.trim());
      buf = "";
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 20 && s.length <= 600);
}

export function nWordWindow(sentence: string, n = 25): string {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length <= n) return sentence;
  return words.slice(0, n).join(" ") + "…";
}
