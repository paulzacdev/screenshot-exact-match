import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { archivesQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { pickSummary } from "@/lib/types";
import { PageHeader } from "@/components/Ornament";
import bible from "@/assets/bible-candle.jpg";
import { PageState } from "@/components/PageState";

export const Route = createFileRoute("/archives/")({
  head: () => ({
    meta: [
      { title: "Archives des homélies — Paroisse d'Oran" },
      { name: "description", content: "Relisez les homélies du vendredi et leurs résumés." },
      { property: "og:title", content: "Archives des homélies — Paroisse d'Oran" },
      { property: "og:description", content: "Toutes les homélies transcrites et résumées." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Archives,
});

function Archives() {
  const { t, lang } = usePrefs();
  const { data = [], isLoading, isError, refetch } = useQuery(archivesQuery);
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const list = data.filter((c) => !n || [c.title, c.celebration_type, ...(c.bible_refs ?? []), JSON.stringify(c.summary ?? "")].join(" ").toLowerCase().includes(n));

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={t("archives")} title={lang === "ar" ? "العظات" : "Les homélies"} italic={lang === "ar" ? "للقراءة من جديد" : "à relire et méditer"} />
      {isLoading ? <PageState /> : isError ? <PageState error retry={() => { void refetch(); }} /> : null}
      <label className="card-art flex items-center gap-3 rounded-full px-5 py-3">
        <Search className="h-4 w-4 shrink-0 text-gold" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full bg-transparent font-display text-lg italic outline-none placeholder:text-muted-foreground" />
      </label>
      <ul className="space-y-5">
        {list.map((c) => {
          const s = pickSummary(c.summary, lang);
          return (
            <li key={c.id}>
              <Link to="/archives/$id" params={{ id: c.id }} className="card-art group grid grid-cols-[30%_1fr] overflow-hidden md:grid-cols-[200px_1fr]">
                <img src={bible} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="relative space-y-2 p-5 pb-12">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{fmtDate(c.started_at, lang)} · {c.celebration_type}</p>
                  <p className="font-display text-2xl leading-tight">{c.title}</p>
                  {s?.central && <p className="line-clamp-2 font-display text-lg italic text-foreground/80">{s.central}</p>}
                  <span className="absolute bottom-3 end-3 grid h-9 w-9 place-items-center rounded-full bg-gold/25 group-hover:bg-gold/40"><ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
                </div>
              </Link>
            </li>
          );
        })}
        {!list.length && <li className="py-10 text-center font-display italic text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}
