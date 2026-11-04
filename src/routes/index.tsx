import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, ArrowRight, CalendarDays } from "lucide-react";
import { activeCelebrationQuery, archivesQuery, eventsQuery } from "@/lib/queries";
import { usePrefs, fmtDate } from "@/lib/prefs";
import { pickSummary } from "@/lib/types";
import { SectionTitle } from "@/components/Ornament";
import church from "@/assets/church-watercolor.jpg";
import bible from "@/assets/bible-candle.jpg";
import olive from "@/assets/olive-branch.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paroisse d'Oran — Homélies en direct" },
      { name: "description", content: "Suivez l'homélie du vendredi en direct, relisez les résumés et consultez l'agenda de la paroisse d'Oran." },
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
  const ar = lang === "ar";

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative -mx-5 -mt-6 min-h-[560px] overflow-hidden md:-mt-10 md:min-h-[520px]">
        <img src={church} alt="" width={1024} height={1280}
          className="absolute inset-y-0 end-0 h-full w-[78%] object-cover object-left opacity-95 md:w-[55%] [mask-image:linear-gradient(to_left,black_55%,transparent),linear-gradient(to_top,transparent,black_25%)] [mask-composite:intersect] rtl:-scale-x-100" />
        <div className="relative z-10 max-w-md space-y-5 px-5 pt-10 md:pt-16">
          <span className="chip-gold">{t("welcome")}</span>
          <div className="gold-rule w-20" />
          <h1 className="font-display text-[3.4rem] font-semibold leading-[0.98] md:text-7xl">
            {ar ? "كلمة الله،" : "La Parole,"}
            <span className="mt-1 block text-[2.4rem] font-normal italic leading-[1.05] md:text-5xl">
              {ar ? "مباشرة وبلغتك" : "en direct et dans votre langue"}
            </span>
          </h1>
          <svg viewBox="0 0 220 10" className="h-2.5 w-44 text-gold" aria-hidden><path d="M2 8 C 60 0, 150 0, 218 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" /></svg>
          <p className="max-w-[16rem] font-display text-xl italic leading-snug text-foreground/85">
            <span className="text-gold">« </span>
            {ar ? "تابع عظة الجمعة نصاً مباشراً بالعربية أو الفرنسية، ثم اقرأ ملخصها." : "Suivez l'homélie du vendredi en texte, en français ou en arabe, puis relisez son résumé."}
            <span className="text-gold"> »</span>
          </p>
        </div>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full" aria-hidden>
          <path d="M0 60 V40 C 120 55, 260 40, 400 5 V60 Z" className="fill-background" />
          <path d="M0 40 C 120 55, 260 40, 400 5" className="stroke-gold" strokeWidth="2" fill="none" />
        </svg>
      </section>

      {/* Live card */}
      <Link to="/direct" className="card-art relative flex items-center gap-4 overflow-hidden p-4 pe-24 transition-transform active:scale-[0.99]">
        <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${active ? "bg-live/15 text-live" : "bg-gold/25 text-foreground"}`}>
          {active ? <span className="live-dot" /> : <Radio className="h-6 w-6" />}
        </span>
        <span className="h-10 w-px shrink-0 bg-gold/60" />
        <div className="min-w-0">
          <p className={`font-display text-xl ${active ? "text-live" : ""}`}>{active ? (active.status === "paused" ? t("paused") : t("liveNow")) : t("noLive")}</p>
          {active && <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">{active.title} · {t("follow")} <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" /></p>}
        </div>
        <img src={olive} alt="" loading="lazy" className="pointer-events-none absolute -end-6 -bottom-2 w-36 opacity-70 rtl:-scale-x-100" />
      </Link>

      {/* Latest homilies */}
      <section className="space-y-6">
        <SectionTitle>{t("latest")}</SectionTitle>
        <div className="grid gap-5 md:grid-cols-2">
          {arch.slice(0, 4).map((c) => {
            const s = pickSummary(c.summary, lang);
            return (
              <Link key={c.id} to="/archives/$id" params={{ id: c.id }} className="card-art group grid grid-cols-[38%_1fr] overflow-hidden transition-transform active:scale-[0.99]">
                <img src={bible} alt="" loading="lazy" className="h-full w-full object-cover" />
                <div className="relative space-y-2 p-4 pb-12">
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(c.started_at, lang)}</p>
                  <p className="font-display text-xl leading-tight">{c.title}</p>
                  {s?.central && <p className="line-clamp-3 font-display italic text-foreground/80">{s.central}</p>}
                  <span className="absolute bottom-3 end-3 grid h-9 w-9 place-items-center rounded-full bg-gold/25 transition-colors group-hover:bg-gold/40"><ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-6">
          <SectionTitle>{t("upcoming")}</SectionTitle>
          <ul className="card-art divide-y divide-gold/25">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-4 p-4">
                <div className="w-12 shrink-0 text-center">
                  <p className="font-display text-3xl leading-none">{fmtDate(e.starts_at, lang, { day: "numeric" })}</p>
                  <p className="text-[10px] uppercase tracking-widest text-gold">{fmtDate(e.starts_at, lang, { month: "short" })}</p>
                </div>
                <div className="min-w-0"><p className="font-display text-lg">{e.title}</p><p className="text-sm text-muted-foreground">{fmtDate(e.starts_at, lang, { weekday: "long", hour: "2-digit", minute: "2-digit" })}</p></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
