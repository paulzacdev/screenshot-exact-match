import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, BookOpen, AlertTriangle, Send, Loader2 } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { pickSummary } from "@/lib/types";
import { askHomily } from "@/lib/parish.functions";

export function SummaryView({ celebrationId, summary, status }: { celebrationId: string; summary: unknown; status: string }) {
  const { t, lang } = usePrefs();
  const s = pickSummary(summary, lang);
  const ask = useServerFn(askHomily);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (status === "generating") return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("generating")}</p>;
  if (!s) return <p className="text-muted-foreground">{t("noSummary")}</p>;

  const List = ({ title, items }: { title: string; items?: string[] }) =>
    items && items.length ? (
      <section className="space-y-2">
        <h3 className="eyebrow">{title}</h3>
        <ul className="space-y-2">{items.map((x, i) => <li key={i} className="flex gap-3 leading-relaxed"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sage" />{x}</li>)}</ul>
      </section>
    ) : null;

  return (
    <div className="space-y-8">
      <blockquote className="border-s-2 border-gold ps-5">
        <p className="eyebrow mb-2">{t("central")}</p>
        <p className="reading">{s.central}</p>
      </blockquote>
      <List title={t("points")} items={s.points} />
      {s.refs?.length ? (
        <section className="space-y-2">
          <h3 className="eyebrow">{t("refs")}</h3>
          <div className="flex flex-wrap gap-2">{s.refs.map((r) => <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-3 py-1 text-sm text-accent-foreground"><BookOpen className="h-3.5 w-3.5" />{r}</span>)}</div>
        </section>
      ) : null}
      <List title={t("teachings")} items={s.teachings} />
      <List title={t("applications")} items={s.applications} />
      <section><h3 className="eyebrow mb-2">{t("conclusion")}</h3><p className="leading-relaxed">{s.conclusion}</p></section>
      {s.uncertain?.length ? (
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="mb-1 flex items-center gap-2 font-medium"><AlertTriangle className="h-4 w-4" />{t("uncertain")}</p>
          <ul className="list-disc ps-5">{s.uncertain.map((u, i) => <li key={i}>{u}</li>)}</ul>
        </div>
      ) : null}

      <div className="border-t pt-6">
        {!open ? (
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:bg-secondary">
            <Sparkles className="h-4 w-4 text-gold" />{t("deepen")}
          </button>
        ) : (
          <form className="space-y-3" onSubmit={async (e) => {
            e.preventDefault(); if (!q.trim()) return;
            setBusy(true); setErr(null); setAnswer(null);
            try { setAnswer((await ask({ data: { id: celebrationId, question: q, lang } })).answer); }
            catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
          }}>
            <label className="eyebrow">{t("ask")}</label>
            <div className="flex gap-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={500}
                className="flex-1 rounded-full border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}
              </button>
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            {answer && <p className="animate-fade-up rounded-lg bg-secondary p-4 leading-relaxed">{answer}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
