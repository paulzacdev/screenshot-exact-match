import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock } from "lucide-react";
import { eventsQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { PageHeader } from "@/components/Ornament";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda des homélies — Paroisse d'Oran" },
      { name: "description", content: "Les prochaines messes du vendredi avec homélie transcrite à la paroisse d'Oran." },
      { property: "og:title", content: "Agenda — Paroisse d'Oran" },
      { property: "og:description", content: "Les prochaines homélies du vendredi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Agenda,
});

function Agenda() {
  const { t, lang } = usePrefs();
  const { data = [] } = useQuery(eventsQuery);
  const list = data.filter((e) => new Date(e.ends_at ?? e.starts_at) >= new Date(Date.now() - 86400000));
  return (
    <div className="space-y-10">
      <PageHeader eyebrow={t("agenda")} title={lang === "ar" ? "عظات الجمعة" : "Homélies"} italic={lang === "ar" ? "كل يوم جمعة" : "chaque vendredi"} />
      <ol className="relative space-y-5 border-s border-gold/50 ps-6">
        {list.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -start-[31px] top-6 h-3 w-3 rounded-full border-2 border-gold bg-background" />
            <div className="card-art flex gap-5 p-5">
              <div className="w-14 shrink-0 border-e border-gold/40 pe-4 text-center">
                <p className="font-display text-4xl font-semibold leading-none">{fmtDate(e.starts_at, lang, { day: "numeric" })}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-gold">{fmtDate(e.starts_at, lang, { month: "short" })}</p>
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="font-display text-xl leading-tight">{e.title}</p>
                <p className="flex items-center gap-1.5 text-sm capitalize text-muted-foreground"><Clock className="h-3.5 w-3.5" />{fmtDate(e.starts_at, lang, { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p>
                {e.location && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
                {e.description && <p className="font-display italic text-foreground/80">{e.description}</p>}
              </div>
            </div>
          </li>
        ))}
        {!list.length && <p className="font-display italic text-muted-foreground">—</p>}
      </ol>
    </div>
  );
}
