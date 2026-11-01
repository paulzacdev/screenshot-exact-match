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

export function SiteShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, dark, setDark } = usePrefs();
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-gold text-lg">✠</span>
            <span className="font-display text-xl">{lang === "ar" ? "رعية وهران" : "Paroisse d'Oran"}</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground">
                {t(n.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
              className="rounded-full px-2.5 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Langue">
              {lang === "fr" ? "عربي" : "FR"}
            </button>
            <button onClick={() => setDark(!dark)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Thème">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link to="/admin" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={t("admin")}>
              <Shield className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">{children}</main>
      <footer className="mx-auto hidden max-w-5xl px-5 pb-10 text-xs text-muted-foreground md:block">
        <Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground data-[status=active]:text-foreground">
              <n.icon className="h-5 w-5" strokeWidth={1.5} />
              {t(n.key)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
