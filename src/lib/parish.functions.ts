import { createServerFn } from "@tanstack/react-start";
import { requireController, requireAdmin, admin, audit, sha256, type Controller } from "./control.server";
import { aiText, transcribeAudio, translate, extractJson } from "./ai.server";
import type { Summary } from "./types";

type Tok = { deviceToken?: string | null };

function owns(c: Controller, cel: { controller_device_id: string | null; controller_user_id: string | null }) {
  return c.kind === "device" ? cel.controller_device_id === c.id : cel.controller_user_id === c.id;
}

async function loadOwned(id: string, c: Controller) {
  const db = await admin();
  const { data: cel } = await db.from("celebrations").select("*").eq("id", id).maybeSingle();
  if (!cel) throw new Error("Célébration introuvable");
  if (!owns(c, cel)) throw new Error("Un autre appareil contrôle cette session");
  return cel;
}

export const whoAmIController = createServerFn({ method: "POST" })
  .inputValidator((d: Tok) => d)
  .handler(async ({ data }) => {
    try {
      const c = await requireController(data.deviceToken, "transcribe");
      return { ok: true as const, kind: c.kind, label: c.label, id: c.id };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });

export const startCelebration = createServerFn({ method: "POST" })
  .inputValidator((d: Tok & { title: string; type: string; lang: "fr" | "ar"; consent: boolean; force?: boolean }) => d)
  .handler(async ({ data }) => {
    if (!data.consent) throw new Error("Le consentement à l'enregistrement est requis");
    const c = await requireController(data.deviceToken, "control");
    const db = await admin();
    const { data: active } = await db.from("celebrations").select("*").in("status", ["live", "paused"]).maybeSingle();
    if (active) {
      if (owns(c, active)) return { id: active.id };
      if (!(data.force && c.kind === "admin")) throw new Error("Une session est déjà contrôlée par un autre appareil");
      await db.from("celebrations").update({ controller_device_id: null, controller_user_id: c.id }).eq("id", active.id);
      await audit(c.label, "session.takeover", { id: active.id });
      return { id: active.id };
    }
    const { data: cel, error } = await db.from("celebrations").insert({
      title: data.title.slice(0, 140) || "Célébration",
      celebration_type: data.type.slice(0, 60) || "Messe",
      source_lang: data.lang,
      status: "live",
      controller_device_id: c.kind === "device" ? c.id : null,
      controller_user_id: c.kind === "admin" ? c.id : null,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await audit(c.label, "session.start", { id: cel.id });
    return { id: cel.id };
  });

export const setCelebrationStatus = createServerFn({ method: "POST" })
  .inputValidator((d: Tok & { id: string; status: "live" | "paused" }) => d)
  .handler(async ({ data }) => {
    const c = await requireController(data.deviceToken, "control");
    await loadOwned(data.id, c);
    const db = await admin();
    await db.from("celebrations").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

export const transcribeChunk = createServerFn({ method: "POST" })
  .inputValidator((d: Tok & { id: string; audio: string; mime: string }) => {
    if (d.audio.length > 8_000_000) throw new Error("Segment audio trop volumineux");
    return d;
  })
  .handler(async ({ data }) => {
    const c = await requireController(data.deviceToken, "transcribe");
    const cel = await loadOwned(data.id, c);
    if (cel.status !== "live") return { text: "" };
    const bytes = Uint8Array.from(atob(data.audio), (ch) => ch.charCodeAt(0));
    const text = await transcribeAudio(bytes, data.mime, cel.source_lang);
    if (!text || text.length < 2) return { text: "" };
    const src = cel.source_lang as "fr" | "ar";
    const other = src === "fr" ? "ar" : "fr";
    let tr: string | null = null;
    try { tr = await translate(text, other); } catch { tr = null; }
    const db = await admin();
    const { count } = await db.from("segments").select("id", { count: "exact", head: true }).eq("celebration_id", data.id);
    await db.from("segments").insert({
      celebration_id: data.id,
      seq: (count ?? 0) + 1,
      text,
      text_fr: src === "fr" ? text : tr,
      text_ar: src === "ar" ? text : tr,
    });
    return { text };
  });

async function generateSummary(id: string) {
  const db = await admin();
  await db.from("celebrations").update({ summary_status: "generating" }).eq("id", id);
  const { data: segs } = await db.from("segments").select("text").eq("celebration_id", id).order("seq");
  const transcript = (segs ?? []).map((s) => s.text).join("\n");
  if (transcript.length < 40) {
    await db.from("celebrations").update({ summary_status: "none" }).eq("id", id);
    return;
  }
  try {
    const raw = await aiText(
      `Tu es un assistant pastoral. À partir UNIQUEMENT de la transcription d'homélie fournie, produis un résumé pédagogique fidèle.
Règles strictes : n'invente AUCUNE référence biblique, citation ou enseignement absent du texte. Les références ne doivent figurer que si elles sont explicitement mentionnées. Signale dans "uncertain" les passages peu clairs ou mal transcrits.
Réponds en JSON strict, sans texte autour, de la forme :
{"fr":{"central":"","points":[],"refs":[],"teachings":[],"applications":[],"conclusion":"","uncertain":[]},"ar":{...même structure traduite en arabe...}}`,
      transcript.slice(0, 60000),
      "medium",
    );
    const parsed = extractJson<{ fr: Summary; ar: Summary }>(raw);
    if (!parsed?.fr) throw new Error("Résumé illisible");
    await db.from("celebrations").update({ summary: parsed as never, summary_status: "ready", bible_refs: parsed.fr.refs ?? [] }).eq("id", id);
  } catch (e) {
    console.error(e);
    await db.from("celebrations").update({ summary_status: "error" }).eq("id", id);
  }
}

export const endCelebration = createServerFn({ method: "POST" })
  .inputValidator((d: Tok & { id: string }) => d)
  .handler(async ({ data }) => {
    const c = await requireController(data.deviceToken, "control");
    await loadOwned(data.id, c);
    const db = await admin();
    await db.from("celebrations").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", data.id);
    await audit(c.label, "session.end", { id: data.id });
    await generateSummary(data.id);
    return { ok: true };
  });

export const regenerateSummary = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    await audit(u.email ?? u.id, "summary.regenerate", { id: data.id });
    await generateSummary(data.id);
    return { ok: true };
  });

export const askHomily = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; question: string; lang: "fr" | "ar" }) => {
    if (!d.question.trim() || d.question.length > 500) throw new Error("Question invalide");
    return d;
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: segs } = await db.from("segments").select("text").eq("celebration_id", data.id).order("seq");
    const transcript = (segs ?? []).map((s) => s.text).join("\n");
    if (!transcript) throw new Error("Pas de transcription disponible");
    const answer = await aiText(
      `Tu aides un fidèle à approfondir une homélie. Réponds en ${data.lang === "ar" ? "arabe" : "français"}, brièvement, en t'appuyant UNIQUEMENT sur la transcription. Si la réponse n'y figure pas, dis-le clairement. N'invente aucune référence biblique.\n\nTRANSCRIPTION:\n${transcript.slice(0, 50000)}`,
      data.question,
    );
    return { answer };
  });

/* ---------- Devices (admin) ---------- */

function randomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, "0");
}

export const createPairing = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; canTranscribe: boolean; canControl: boolean }) => d)
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const code = randomCode();
    const db = await admin();
    const { data: dev, error } = await db.from("devices").insert({
      name: data.name.slice(0, 60) || "Appareil",
      pairing_code_hash: await sha256(code),
      pairing_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
      can_transcribe: data.canTranscribe,
      can_control: data.canControl,
      created_by: u.id,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await audit(u.email ?? u.id, "device.create", { id: dev.id, name: data.name });
    return { id: dev.id, code };
  });

export const redeemPairing = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }) => {
    const code = data.code.replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Code invalide");
    const db = await admin();
    const { data: dev } = await db.from("devices").select("*").eq("pairing_code_hash", await sha256(code)).maybeSingle();
    if (!dev || dev.revoked_at || !dev.pairing_expires_at || new Date(dev.pairing_expires_at) < new Date())
      throw new Error("Code invalide ou expiré");
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    await db.from("devices").update({
      token_hash: await sha256(token), pairing_code_hash: null, pairing_expires_at: null,
      paired_at: new Date().toISOString(), last_seen_at: new Date().toISOString(),
    }).eq("id", dev.id);
    await audit(dev.name, "device.paired", { id: dev.id });
    return { token, name: dev.name };
  });

export const revokeDevice = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const u = await requireAdmin();
    const db = await admin();
    await db.from("devices").update({ revoked_at: new Date().toISOString(), token_hash: null }).eq("id", data.id);
    // release any session it controls
    await db.from("celebrations").update({ status: "paused", controller_device_id: null }).eq("controller_device_id", data.id).in("status", ["live", "paused"]);
    await audit(u.email ?? u.id, "device.revoke", { id: data.id });
    return { ok: true };
  });
