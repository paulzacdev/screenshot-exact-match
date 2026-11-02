import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { eventsQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda paroissial — Paroisse d'Oran" },
      { name: "description", content: "Messes, célébrations et rencontres à venir à la paroisse d'Oran." },
      { property: "og:title", content: "Agenda — Paroisse d'Oran" },
      { property: "og:description", content: "Les prochaines célébrations et rencontres." },
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
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("agenda")}</h1>
      <ul className="space-y-3">
        {list.map((e) => (
          <li key={e.id} className="flex gap-5 rounded-2xl border border-border bg-card p-5">
            <div className="w-14 shrink-0 text-center">
              <p className="font-display text-3xl leading-none">{fmtDate(e.starts_at, lang, { day: "numeric" })}</p>
              <p className="text-xs uppercase text-muted-foreground">{fmtDate(e.starts_at, lang, { month: "short" })}</p>
            </div>
            <div className="space-y-1">
              <p className="eyebrow">{e.kind} · {fmtDate(e.starts_at, lang, { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p>
              <p className="font-display text-xl">{e.title}</p>
              {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
              {e.location && <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{e.location}</p>}
            </div>
          </li>
        ))}
        {!list.length && <p className="text-muted-foreground">—</p>}
      </ul>
    </div>
  );
}
