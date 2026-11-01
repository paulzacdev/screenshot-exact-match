// Server-only AI helpers (Lovable AI Gateway). Never import from client code.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const BASE = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "openai/gpt-6-astra";
const STT_MODEL = "openai/gpt-transcribe";

function key() {
  const k = process.env["LOVABLE_API_KEY"];
  if (!k) throw new Error("Clé IA manquante (LOVABLE_API_KEY)");
  return k;
}

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function aiText(instructions: string, prompt: string, effort: "low" | "medium" = "low") {
  const apiKey = key();
  const provider = createOpenAI({
    baseURL: BASE,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses(CHAT_MODEL),
    instructions,
    messages: [{ role: "user", content: prompt }],
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: effort,
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return (await result.text).trim();
}

export async function transcribeAudio(bytes: Uint8Array, mime: string, lang?: string) {
  const apiKey = key();
  const type = mime.startsWith("audio/") ? mime.split(";")[0] : "audio/webm";
  const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
  const form = new FormData();
  form.append("model", STT_MODEL);
  form.append("file", new File([bytes], `chunk.${ext}`, { type }), `chunk.${ext}`);
  form.append("response_format", "json");
  form.append("stream", "true");
  form.append("languages", lang === "ar" ? "ar" : "fr");
  form.append("prompt", "Homélie catholique, paroisse d'Oran. Termes liturgiques et bibliques.");
  const res = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    let msg = t;
    try { msg = JSON.parse(t)?.error?.message ?? JSON.parse(t)?.message ?? t; } catch { /* keep */ }
    throw new AiError(res.status, msg || `Erreur transcription (${res.status})`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", deltas = "", done = "";
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "transcript.text.delta") deltas += ev.delta ?? "";
        if (ev.type === "transcript.text.done") done = ev.text ?? "";
      } catch { /* ignore */ }
    }
  }
  return (done || deltas).trim();
}

export async function translate(text: string, target: "fr" | "ar") {
  const lang = target === "ar" ? "arabe standard moderne" : "français";
  return aiText(
    `Tu es traducteur liturgique. Traduis fidèlement en ${lang} le segment d'homélie fourni, en gardant le sens des phrases. Réponds uniquement par la traduction, sans commentaire.`,
    text,
  );
}

export function extractJson<T>(raw: string): T | null {
  const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
  if (s < 0 || e < s) return null;
  try { return JSON.parse(raw.slice(s, e + 1)) as T; } catch { return null; }
}
