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
      <header className="space-y-2">
        <p className="eyebrow">{fmtDate(c.started_at, lang)} · {c.celebration_type}</p>
        <h1 className="font-display text-4xl">{c.title}</h1>
      </header>
      <div className="flex gap-2 border-b border-border">
        {(["summary", "transcript"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>{t(k)}</button>
        ))}
      </div>
      {tab === "summary" ? <SummaryView celebrationId={c.id} summary={c.summary} status={c.summary_status} /> : <TranscriptLive celebrationId={c.id} sourceLang={c.source_lang} />}
    </article>
  );
}
