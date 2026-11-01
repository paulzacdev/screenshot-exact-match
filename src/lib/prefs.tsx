import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./types";

const dict = {
  fr: {
    home: "Accueil", live: "Direct", archives: "Archives", agenda: "Agenda", admin: "Administration",
    welcome: "Bienvenue", liveNow: "Célébration en cours", noLive: "Aucune célébration en cours",
    follow: "Suivre en direct", latest: "Dernières homélies", summary: "Résumé", transcript: "Transcription",
    deepen: "Approfondir", ask: "Poser une question sur l'homélie", send: "Envoyer", search: "Rechercher",
    central: "Message central", points: "Idées principales", refs: "Références bibliques",
    teachings: "Enseignements spirituels", applications: "Au quotidien", conclusion: "Conclusion",
    uncertain: "Passages incertains", waiting: "En attente des premières paroles…", upcoming: "Prochainement",
    paused: "En pause", ended: "Terminée", generating: "Résumé en préparation…", noSummary: "Pas encore de résumé",
  },
  ar: {
    home: "الرئيسية", live: "مباشر", archives: "الأرشيف", agenda: "المواعيد", admin: "الإدارة",
    welcome: "أهلاً وسهلاً", liveNow: "احتفال جارٍ الآن", noLive: "لا يوجد احتفال جارٍ",
    follow: "تابع مباشرة", latest: "آخر العظات", summary: "ملخص", transcript: "النص الكامل",
    deepen: "تعمّق", ask: "اطرح سؤالاً عن العظة", send: "إرسال", search: "بحث",
    central: "الرسالة المحورية", points: "الأفكار الرئيسية", refs: "المراجع الكتابية",
    teachings: "تعاليم روحية", applications: "في الحياة اليومية", conclusion: "خاتمة",
    uncertain: "مقاطع غير مؤكدة", waiting: "في انتظار الكلمات الأولى…", upcoming: "قريباً",
    paused: "متوقف مؤقتاً", ended: "انتهى", generating: "جارٍ إعداد الملخص…", noSummary: "لا يوجد ملخص بعد",
  },
} as const;

export type TKey = keyof typeof dict.fr;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; dark: boolean; setDark: (d: boolean) => void; t: (k: TKey) => string };
const PrefsCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("fr");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const l = localStorage.getItem("paroisse-lang");
    if (l === "ar" || l === "fr") setLang(l);
    setDark(localStorage.getItem("paroisse-theme") === "dark");
  }, []);
  useEffect(() => {
    localStorage.setItem("paroisse-lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("paroisse-theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <PrefsCtx.Provider value={{ lang, setLang, dark, setDark, t: (k) => dict[lang][k] }}>{children}</PrefsCtx.Provider>
  );
}

export function usePrefs() {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error("PrefsProvider missing");
  return c;
}

export function fmtDate(d: string | Date, lang: Lang, opts: Intl.DateTimeFormatOptions = { dateStyle: "long" }) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-DZ" : "fr-FR", { timeZone: "Africa/Algiers", ...opts }).format(new Date(d));
}
