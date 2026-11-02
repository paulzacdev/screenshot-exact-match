import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Pause, Play, Square, Loader2 } from "lucide-react";
import { whoAmIController, startCelebration, setCelebrationStatus, transcribeChunk, endCelebration } from "@/lib/parish.functions";
import { activeCelebrationQuery } from "@/lib/queries";
import { DEVICE_TOKEN_KEY } from "@/lib/types";
import { TranscriptLive } from "@/components/TranscriptLive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/enregistrer")({
  head: () => ({
    meta: [
      { title: "Enregistrement — Paroisse d'Oran" },
      { name: "description", content: "Écran de transcription réservé aux appareils autorisés." },
      { property: "og:title", content: "Enregistrement — Paroisse d'Oran" },
      { property: "og:description", content: "Écran de transcription réservé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Recorder,
});

const CHUNK_MS = 10000;

function blobToB64(b: Blob) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}

function Recorder() {
  const who = useServerFn(whoAmIController);
  const start = useServerFn(startCelebration);
  const setStatus = useServerFn(setCelebrationStatus);
  const chunk = useServerFn(transcribeChunk);
  const end = useServerFn(endCelebration);
  const { data: active, refetch } = useQuery(activeCelebrationQuery);

  const [token, setToken] = useState<string | null>(null);
  const [ctrl, setCtrl] = useState<{ ok: boolean; label?: string; error?: string } | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Messe dominicale");
  const [lang, setLang] = useState<"fr" | "ar">("fr");
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const loopRef = useRef(false);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    const tk = localStorage.getItem(DEVICE_TOKEN_KEY);
    setToken(tk);
    who({ data: { deviceToken: tk } }).then(setCtrl).catch((e) => setCtrl({ ok: false, error: String(e) }));
  }, [who]);

  useEffect(() => () => stopMic(), []);

  function stopMic() {
    loopRef.current = false;
    recRef.current?.state === "recording" && recRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setRecording(false);
  }

  // Each chunk is a self-contained recording so the server can decode it alone.
  function recordOne() {
    const stream = streamRef.current;
    if (!stream || !loopRef.current) return;
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    recRef.current = rec;
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
    rec.onstop = async () => {
      if (loopRef.current) recordOne();
      const blob = new Blob(parts, { type: mime });
      if (blob.size < 2000 || !idRef.current) return;
      setPending((n) => n + 1);
      try {
        await chunk({ data: { deviceToken: token, id: idRef.current, audio: await blobToB64(blob), mime } });
      } catch (e) { toast.error((e as Error).message); }
      finally { setPending((n) => n - 1); }
    };
    rec.start();
    setTimeout(() => rec.state === "recording" && rec.stop(), CHUNK_MS);
  }

  async function startMic(id: string) {
    idRef.current = id;
    streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    loopRef.current = true;
    setRecording(true);
    recordOne();
  }

  async function onStart() {
    setBusy(true);
    try {
      const r = await start({ data: { deviceToken: token, title, type, lang, consent } });
      await startMic(r.id);
      refetch();
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  }

  async function onPause() {
    if (!active) return;
    stopMic();
    await setStatus({ data: { deviceToken: token, id: active.id, status: "paused" } }).catch((e) => toast.error(e.message));
    refetch();
  }

  async function onResume() {
    if (!active) return;
    try {
      await setStatus({ data: { deviceToken: token, id: active.id, status: "live" } });
      await startMic(active.id);
      refetch();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onEnd() {
    if (!active || !confirm("Terminer la célébration et générer le résumé ?")) return;
    stopMic();
    setBusy(true);
    try { await end({ data: { deviceToken: token, id: active.id } }); toast.success("Célébration terminée"); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
    refetch();
  }

  if (!ctrl) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin" />;
  if (!ctrl.ok) return (
    <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <p className="font-display text-3xl">Appareil non autorisé</p>
      <p className="text-muted-foreground">{ctrl.error}</p>
      <div className="flex justify-center gap-3"><Button asChild><Link to="/appareil">Appairer</Link></Button><Button asChild variant="outline"><Link to="/auth">Connexion admin</Link></Button></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Enregistrement</h1>
        <span className="text-sm text-muted-foreground">{ctrl.label}</span>
      </header>

      {!active ? (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <Input placeholder="Titre (ex. 3e dimanche de l'Avent)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Type de célébration" value={type} onChange={(e) => setType(e.target.value)} />
          <div className="flex gap-2">
            {(["fr", "ar"] as const).map((l) => (
              <Button key={l} type="button" variant={lang === l ? "default" : "outline"} onClick={() => setLang(l)}>{l === "fr" ? "Français" : "العربية"}</Button>
            ))}
          </div>
          <label className="flex items-start gap-3 text-sm">
            <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
            Le célébrant consent à la transcription de l'homélie. L'audio n'est pas conservé.
          </label>
          <Button size="lg" className="w-full" disabled={!consent || busy} onClick={onStart}><Mic className="me-2 h-4 w-4" />Démarrer</Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <p className="font-display text-2xl">{active.title}</p>
          <p className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${recording ? "animate-pulse bg-live" : "bg-muted-foreground"}`} />
            {recording ? "Micro actif" : active.status === "paused" ? "En pause" : "Micro coupé — reprenez pour continuer"}
            {pending > 0 && <span className="text-muted-foreground">· {pending} segment(s) en cours</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {recording
              ? <Button variant="outline" onClick={onPause}><Pause className="me-2 h-4 w-4" />Pause</Button>
              : <Button onClick={onResume}><Play className="me-2 h-4 w-4" />Reprendre</Button>}
            <Button variant="destructive" disabled={busy} onClick={onEnd}>{busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Square className="me-2 h-4 w-4" />}Terminer</Button>
          </div>
        </div>
      )}

      {active && <TranscriptLive celebrationId={active.id} live sourceLang={active.source_lang} />}
    </div>
  );
}
