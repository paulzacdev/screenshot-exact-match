import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { celebrationQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { SummaryView } from "@/components/SummaryView";
import { TranscriptLive } from "@/components/TranscriptLive";

export const Route = createFileRoute("/archives/$id")({
  head: () => ({
    meta: [
      { title: "Homélie — Paroisse d'Oran" },
      { name: "description", content: "Résumé et transcription complète de l'homélie." },
      { property: "og:title", content: "Homélie — Paroisse d'Oran" },
      { property: "og:description", content: "Résumé et transcription de l'homélie." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { t, lang } = usePrefs();
  const { data: c, isLoading } = useQuery(celebrationQuery(id));
  const [tab, setTab] = useState<"summary" | "transcript">("summary");
  if (isLoading) return null;
  if (!c) return <p className="py-20 text-center">Introuvable. <Link to="/archives" className="underline">{t("archives")}</Link></p>;
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-3">
        <span className="chip-gold">{fmtDate(c.started_at, lang)} · {c.celebration_type}</span>
        <div className="gold-rule w-16" />
        <h1 className="font-display text-5xl font-semibold leading-tight">{c.title}</h1>
      </header>
      <div className="card-art inline-flex gap-1 rounded-full p-1">
        {(["summary", "transcript"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-5 py-2 font-display text-lg transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t(k)}</button>
        ))}
      </div>
      <div className="card-art p-6 md:p-10">{tab === "summary" ? <SummaryView celebrationId={c.id} summary={c.summary} status={c.summary_status} /> : <TranscriptLive celebrationId={c.id} sourceLang={c.source_lang} />}</div>
    </article>
  );
}
