import type { ReactNode } from "react";

/** Section title flanked by gold rules with a small cross. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <span className="text-gold text-lg leading-none">✝</span>
      <div className="flex w-full items-center gap-4">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/70" />
        <h2 className="font-display text-3xl font-semibold md:text-4xl">{children}</h2>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/70" />
      </div>
    </div>
  );
}

/** Editorial page header used on inner pages. */
export function PageHeader({ eyebrow, title, italic, children }: { eyebrow: string; title: string; italic?: string; children?: ReactNode }) {
  return (
    <header className="space-y-4">
      <span className="chip-gold">{eyebrow}</span>
      <div className="gold-rule w-16" />
      <h1 className="font-display text-5xl font-semibold leading-[1.02] md:text-6xl">
        {title}
        {italic && <span className="block font-normal italic text-foreground/85">{italic}</span>}
      </h1>
      {children}
    </header>
  );
}
