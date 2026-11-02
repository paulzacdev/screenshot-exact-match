import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, ArrowRight, CalendarDays } from "lucide-react";
import { activeCelebrationQuery, archivesQuery, eventsQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { pickSummary } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paroisse d'Oran — Homélies en direct" },
      { name: "description", content: "Suivez l'homélie en direct, relisez les résumés et consultez l'agenda de la paroisse d'Oran." },
      { property: "og:title", content: "Paroisse d'Oran — Homélies en direct" },
      { property: "og:description", content: "Homélies en direct en français et en arabe, archives et agenda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = usePrefs();
  const { data: active } = useQuery(activeCelebrationQuery);
  const { data: arch = [] } = useQuery(archivesQuery);
  const { data: events = [] } = useQuery(eventsQuery);
  const upcoming = events.filter((e) => new Date(e.starts_at) > new Date()).slice(0, 3);

  return (
    <div className="space-y-14">
      <section className="space-y-4 pt-4">
        <p className="eyebrow">{t("welcome")}</p>
        <h1 className="font-display text-5xl leading-tight md:text-6xl">
          {lang === "ar" ? "كلمة الله، مباشرة وبلغتك" : "La Parole, en direct et dans votre langue"}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {lang === "ar" ? "تابع العظة نصاً مباشراً بالعربية أو الفرنسية، ثم اقرأ ملخصها." : "Suivez l'homélie en texte, en français ou en arabe, puis relisez son résumé."}
        </p>
      </section>

      <Link to="/direct" className="block rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm">
              {active ? <span className="h-2 w-2 animate-pulse rounded-full bg-live" /> : <Radio className="h-4 w-4 text-muted-foreground" />}
              <span className={active ? "text-live" : "text-muted-foreground"}>{active ? (active.status === "paused" ? t("paused") : t("liveNow")) : t("noLive")}</span>
            </p>
            {active && <p className="font-display text-2xl">{active.title}</p>}
          </div>
          {active && <span className="flex items-center gap-1 text-sm">{t("follow")} <ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>}
        </div>
      </Link>

      <section className="space-y-5">
        <h2 className="font-display text-3xl">{t("latest")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {arch.slice(0, 4).map((c) => {
            const s = pickSummary(c.summary, lang);
            return (
              <Link key={c.id} to="/archives/$id" params={{ id: c.id }} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <p className="eyebrow">{fmtDate(c.started_at, lang)} · {c.celebration_type}</p>
                <p className="mt-2 font-display text-xl">{c.title}</p>
                {s?.central && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{s.central}</p>}
              </Link>
            );
          })}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-5">
          <h2 className="font-display text-3xl">{t("upcoming")}</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-4 p-4">
                <CalendarDays className="h-5 w-5 text-sage" strokeWidth={1.5} />
                <div><p className="font-medium">{e.title}</p><p className="text-sm text-muted-foreground">{fmtDate(e.starts_at, lang, { dateStyle: "full", timeStyle: "short" })}{e.location ? ` · ${e.location}` : ""}</p></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
