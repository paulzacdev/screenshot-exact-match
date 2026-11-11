import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

// Shown on every visit (dismissal lasts only for the current session) unless the app is already installed.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone || window.self !== window.top || sessionStorage.getItem("install-dismissed")) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setOpen(true);
    };
    const onInstalled = () => setOpen(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      setIos(true);
      setOpen(true);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!open) return null;

  const close = () => {
    sessionStorage.setItem("install-dismissed", "1");
    setOpen(false);
  };
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Installer l'application" className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-accent/40 bg-card p-4 shadow-xl md:bottom-6">
      <button onClick={close} aria-label="Fermer" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <img src="/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
        <div className="space-y-1">
          <p className="font-serif text-lg font-bold text-primary">Installer l'application</p>
          {ios ? (
            <p className="text-sm text-muted-foreground">
              Touchez <Share className="inline h-4 w-4" /> Partager, puis « Sur l'écran d'accueil ».
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Retrouvez les homélies en un geste depuis votre écran d'accueil.</p>
          )}
        </div>
      </div>
      {!ios && (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={close}>Plus tard</Button>
          <Button size="sm" onClick={install}><Download className="mr-1 h-4 w-4" />Installer</Button>
        </div>
      )}
    </div>
  );
}
