// Server-only AI helpers (Lovable AI Gateway SDK). Never import from client code.
import { generateResponse, transcribeAudio as gwTranscribe, GatewayError } from "@lovable.dev/ai-gateway";

export class AiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function friendly(e: unknown): never {
  if (e instanceof GatewayError) {
    const s = e.httpStatus ?? 500;
    if (s === 429) throw new AiError(s, "Trop de requêtes IA, réessayez dans un instant.");
    if (s === 402) throw new AiError(s, "Crédits IA épuisés.");
    throw new AiError(s, e.message || "Erreur du service IA");
  }
  throw e;
}

function outText(r: unknown): string {
  const any = r as { output_text?: string; output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }> };
  if (typeof any.output_text === "string" && any.output_text) return any.output_text;
  return (any.output ?? [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text ?? "")
    .join("");
}

export async function aiText(instructions: string, prompt: string, effort: "low" | "medium" = "low") {
  try {
    const r = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions,
      input: prompt,
      reasoning: { effort },
    });
    return outText(r).trim();
  } catch (e) { friendly(e); }
}

export async function transcribeAudio(bytes: Uint8Array, mime: string, lang?: string) {
  const type: string = (mime.startsWith("audio/") ? mime.split(";")[0] : undefined) ?? "audio/webm";
  const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
  try {
    const r = await gwTranscribe({
      model: "openai/gpt-transcribe",
      file: new File([bytes as BlobPart], `chunk.${ext}`, { type }),
      response_format: "json",
      language: lang === "ar" ? "ar" : "fr",
      prompt: "Homélie catholique, paroisse d'Oran. Termes liturgiques et bibliques.",
    });
    const text = typeof r === "string" ? r : (r as { text?: string }).text ?? "";
    return text.trim();
  } catch (e) { friendly(e); }
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
