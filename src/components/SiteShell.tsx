import { Link } from "@tanstack/react-router";
import { Home, Radio, Library, CalendarDays, Moon, Sun, Shield } from "lucide-react";
import type { ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";

const nav = [
  { to: "/", key: "home", icon: Home },
  { to: "/direct", key: "live", icon: Radio },
  { to: "/archives", key: "archives", icon: Library },
  { to: "/agenda", key: "agenda", icon: CalendarDays },
] as const;

function Logo() {
  return (
    <svg viewBox="0 0 48 40" className="h-9 w-11 shrink-0 text-gold" fill="none" aria-hidden>
      <path d="M20 4h4v8h8v4h-8v14h-4V16h-8v-4h8z" fill="currentColor" />
      <path d="M2 34c10-6 22 2 44-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, dark, setDark } = usePrefs();
  return (
    <div className="min-h-screen overflow-x-hidden pb-24 md:pb-0">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-5">
          <a href="/" className="flex min-w-0 items-center gap-2">
            <Logo />
            <span className="truncate font-display text-2xl font-medium">{lang === "ar" ? "رعية وهران" : "Paroisse d'Oran"}</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="relative px-3 py-1.5 font-display text-lg text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground data-[status=active]:after:absolute data-[status=active]:after:inset-x-3 data-[status=active]:after:-bottom-0.5 data-[status=active]:after:h-0.5 data-[status=active]:after:rounded-full data-[status=active]:after:bg-gold">
                {t(n.key)}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center">
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="rounded-full px-2.5 py-1 text-sm hover:bg-secondary" aria-label="Langue">
              {lang === "fr" ? "عربي" : "FR"}
            </button>
            <button onClick={() => setDark(!dark)} className="rounded-full p-2 hover:bg-secondary" aria-label="Thème">
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <span className="mx-1 h-5 w-px bg-border" />
            <a href="/admin" className="rounded-full p-2 hover:bg-secondary" aria-label={t("admin")}>
              <Shield className="h-5 w-5" />
            </a>
          </div>
        </div>
        <svg viewBox="0 0 1200 12" preserveAspectRatio="none" className="block h-3 w-full text-gold" aria-hidden>
          <path d="M0 10 C 200 0, 420 4, 600 8 S 1000 10, 1200 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-6 md:py-10">{children}</main>
      <footer className="mx-auto hidden max-w-5xl items-center justify-between px-5 pb-10 text-xs text-muted-foreground md:flex">
        <span className="font-display text-sm italic">« Ta parole est la lumière de mes pas » — Ps 118</span>
        <a href="/confidentialite" className="hover:text-foreground">Confidentialité</a>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 rounded-t-[2rem] border-t border-gold/40 bg-card/95 shadow-[0_-10px_30px_-15px_oklch(0.3_0.05_60/0.35)] backdrop-blur md:hidden">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="group flex flex-col items-center gap-1 pt-3 pb-2.5 font-display text-[15px] text-muted-foreground data-[status=active]:text-foreground">
              <n.icon className="h-6 w-6" strokeWidth={1.6} />
              {t(n.key)}
              <span className="h-0.5 w-10 rounded-full bg-transparent group-data-[status=active]:bg-gold" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
