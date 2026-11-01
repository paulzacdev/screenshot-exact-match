export type Summary = {
  central: string;
  points: string[];
  refs: string[];
  teachings: string[];
  applications: string[];
  conclusion: string;
  uncertain?: string[];
};

export type Lang = "fr" | "ar";

/** Accepts either {fr,ar} or a flat (legacy/demo) French summary. */
export function pickSummary(raw: unknown, lang: Lang): Summary | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r["fr"] || r["ar"]) return ((r[lang] ?? r["fr"]) as Summary) ?? null;
  return r as unknown as Summary;
}

export const DEVICE_TOKEN_KEY = "paroisse-device-token";
