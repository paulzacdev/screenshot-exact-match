import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeCelebrationQuery } from "@/lib/queries";
import { usePrefs } from "@/lib/prefs";
import { TranscriptLive } from "@/components/TranscriptLive";

export const Route = createFileRoute("/direct")({
  head: () => ({
    meta: [
      { title: "En direct — Paroisse d'Oran" },
      { name: "description", content: "Transcription en direct de l'homélie, en français et en arabe." },
      { property: "og:title", content: "Homélie en direct — Paroisse d'Oran" },
      { property: "og:description", content: "Suivez l'homélie en texte, en temps réel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Direct,
});

function Direct() {
  const { t } = usePrefs();
  const qc = useQueryClient();
  const { data: active, isLoading } = useQuery(activeCelebrationQuery);

  useEffect(() => {
    const ch = supabase.channel(`cel-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "celebrations" }, () => qc.invalidateQueries({ queryKey: ["celebration"] }))
      .subscribe();
    const iv = setInterval(() => qc.invalidateQueries({ queryKey: ["celebration", "active"] }), 20000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [qc]);

  if (isLoading) return null;
  if (!active) return (
    <div className="py-20 text-center space-y-4">
      <p className="font-display text-3xl">{t("noLive")}</p>
      <Link to="/archives" className="text-sm underline underline-offset-4">{t("archives")}</Link>
    </div>
  );
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <p className="flex items-center gap-2 text-sm text-live">
          <span className={`h-2 w-2 rounded-full bg-live ${active.status === "live" ? "animate-pulse" : ""}`} />
          {active.status === "paused" ? t("paused") : t("liveNow")}
        </p>
        <h1 className="font-display text-4xl">{active.title}</h1>
        <p className="text-muted-foreground">{active.celebration_type}</p>
      </header>
      <TranscriptLive celebrationId={active.id} live sourceLang={active.source_lang} />
    </article>
  );
}
