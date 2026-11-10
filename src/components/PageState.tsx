import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageState({ error = false, retry }: { error?: boolean; retry?: () => void }) {
  return (
    <div role={error ? "alert" : "status"} className="mx-auto flex min-h-48 max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      {!error && <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />}
      <p className="font-display text-xl text-foreground">{error ? "Le contenu n’a pas pu être chargé." : "Chargement en cours…"}</p>
      {error && <p className="text-sm text-muted-foreground">Vérifiez votre connexion, puis réessayez.</p>}
      {error && retry && <Button variant="outline" onClick={retry}><RefreshCw className="h-4 w-4" />Réessayer</Button>}
    </div>
  );
}