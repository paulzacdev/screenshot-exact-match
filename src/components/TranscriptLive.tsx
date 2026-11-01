import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { segmentsQuery } from "@/lib/queries";
import { usePrefs } from "@/lib/prefs";

/** Text-only realtime transcript. Visitors never receive audio. */
export function TranscriptLive({ celebrationId, live, sourceLang }: { celebrationId: string; live?: boolean; sourceLang: string }) {
  const { lang, t } = usePrefs();
  const qc = useQueryClient();
  const { data: segs = [] } = useQuery(segmentsQuery(celebrationId));
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live) return;
    const ch = supabase
      .channel(`segs-${celebrationId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "segments", filter: `celebration_id=eq.${celebrationId}` },
        () => qc.invalidateQueries({ queryKey: ["segments", celebrationId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [celebrationId, live, qc]);

  useEffect(() => { if (live) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [segs.length, live]);

  if (!segs.length) return <p className="py-10 text-center text-muted-foreground">{t("waiting")}</p>;
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="space-y-5">
      {segs.map((s) => {
        const txt = (lang === "ar" ? s.text_ar : s.text_fr) ?? s.text;
        const isTranslated = lang !== sourceLang;
        return (
          <p key={s.id} className={`reading animate-fade-up ${lang === "ar" ? "font-arabic text-[1.3rem]" : ""}`}>
            {txt}
            {isTranslated && !(lang === "ar" ? s.text_ar : s.text_fr) && <span className="ms-2 text-xs text-muted-foreground">(original)</span>}
          </p>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
