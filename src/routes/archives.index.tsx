import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { archivesQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { pickSummary } from "@/lib/types";

export const Route = createFileRoute("/archives/")({
  head: () => ({
    meta: [
      { title: "Archives des homélies — Paroisse d'Oran" },
      { name: "description", content: "Relisez les homélies passées et leurs résumés." },
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
  const { data = [] } = useQuery(archivesQuery);
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const list = data.filter((c) => !n || [c.title, c.celebration_type, ...(c.bible_refs ?? []), JSON.stringify(c.summary ?? "")].join(" ").toLowerCase().includes(n));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl">{t("archives")}</h1>
      <label className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")} className="w-full bg-transparent outline-none" />
      </label>
      <ul className="divide-y divide-border">
        {list.map((c) => {
          const s = pickSummary(c.summary, lang);
          return (
            <li key={c.id}>
              <Link to="/archives/$id" params={{ id: c.id }} className="block py-5 hover:opacity-80">
                <p className="eyebrow">{fmtDate(c.started_at, lang)} · {c.celebration_type}</p>
                <p className="mt-1 font-display text-2xl">{c.title}</p>
                {s?.central && <p className="mt-1 line-clamp-2 text-muted-foreground">{s.central}</p>}
              </Link>
            </li>
          );
        })}
        {!list.length && <li className="py-10 text-center text-muted-foreground">—</li>}
      </ul>
    </div>
  );
}
