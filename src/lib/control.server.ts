// Server-only authorization for controlling transcription sessions.
import { getRequestHeader } from "@tanstack/react-start/server";

export async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type Controller = { kind: "device" | "admin"; id: string; label: string };

/** Admin user from the bearer token, or null. Verified server-side. */
export async function getAdminUser() {
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const db = await admin();
  const { data } = await db.auth.getUser(auth.slice(7));
  if (!data.user) return null;
  const { data: role } = await db.from("user_roles").select("id").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
  return role ? data.user : null;
}

export async function requireAdmin() {
  const u = await getAdminUser();
  if (!u) throw new Error("Accès réservé aux administrateurs");
  return u;
}

/** Resolve who is controlling: a paired, non-revoked device (by token) or an admin account. */
export async function requireController(deviceToken?: string | null, need: "transcribe" | "control" = "transcribe"): Promise<Controller> {
  const db = await admin();
  if (deviceToken) {
    const hash = await sha256(deviceToken);
    const { data: dev } = await db.from("devices").select("*").eq("token_hash", hash).maybeSingle();
    if (!dev || dev.revoked_at) throw new Error("Appareil non autorisé ou révoqué");
    if (need === "transcribe" && !dev.can_transcribe) throw new Error("Cet appareil n'a pas le droit de transcrire");
    if (need === "control" && !dev.can_control) throw new Error("Cet appareil n'a pas le droit de contrôler la session");
    await db.from("devices").update({ last_seen_at: new Date().toISOString() }).eq("id", dev.id);
    return { kind: "device", id: dev.id, label: dev.name };
  }
  const u = await getAdminUser();
  if (u) return { kind: "admin", id: u.id, label: u.email ?? "admin" };
  throw new Error("Seul un appareil autorisé peut contrôler la transcription");
}

export async function audit(actor: string, action: string, details?: Record<string, unknown>) {
  const db = await admin();
  await db.from("audit_log").insert({ actor, action, details: (details ?? null) as never });
}
