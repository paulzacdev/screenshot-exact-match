import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { activeCelebrationQuery } from "@/lib/queries";
import { usePrefs } from "@/lib/prefs";
import { Radio } from "lucide-react";
import olive from "@/assets/olive-branch.png";
import { TranscriptLive } from "@/components/TranscriptLive";
import { PageState } from "@/components/PageState";

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
  const { data: active, isLoading, isError, refetch } = useQuery(activeCelebrationQuery);

  useEffect(() => {
    const ch = supabase.channel(`cel-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "celebrations" }, () => qc.invalidateQueries({ queryKey: ["celebration"] }))
      .subscribe();
    const iv = setInterval(() => qc.invalidateQueries({ queryKey: ["celebration", "active"] }), 20000);
    return () => { supabase.removeChannel(ch); clearInterval(iv); };
  }, [qc]);

  if (isLoading) return <PageState />;
  if (isError) return <PageState error retry={() => { void refetch(); }} />;
  if (!active) return (
    <div className="card-art relative mx-auto mt-6 max-w-xl overflow-hidden px-6 py-16 text-center space-y-5">
      <img src={olive} alt="" className="pointer-events-none absolute -end-10 -top-4 w-48 opacity-50" />
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gold/25"><Radio className="h-7 w-7" /></span>
      <p className="font-display text-4xl">{t("noLive")}</p>
      <p className="font-display text-lg italic text-muted-foreground">L'homélie est transcrite ici chaque vendredi.</p>
      <Link to="/archives" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">{t("archives")}</Link>
    </div>
  );
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <p className="chip-gold text-live">
          <span className={active.status === "live" ? "live-dot" : "h-2 w-2 rounded-full bg-live"} />
          {active.status === "paused" ? t("paused") : t("liveNow")}
        </p>
        <div className="gold-rule w-16" />
        <h1 className="font-display text-5xl font-semibold leading-tight">{active.title}</h1>
        <p className="font-display text-xl italic text-muted-foreground">{active.celebration_type}</p>
      </header>
      <div className="card-art p-6 md:p-10"><TranscriptLive celebrationId={active.id} live sourceLang={active.source_lang} /></div>
    </article>
  );
}
