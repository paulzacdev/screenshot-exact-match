import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion administrateur — Paroisse d'Oran" },
      { name: "description", content: "Espace réservé à l'équipe paroissiale." },
      { property: "og:title", content: "Connexion — Paroisse d'Oran" },
      { property: "og:description", content: "Espace réservé à l'équipe paroissiale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "up" && email.trim().toLowerCase() !== "zacpaul437@gmail.com") {
      toast.error("La création de compte est réservée aux administrateurs. Les fidèles n'ont pas besoin de compte.");
      return;
    }
    setBusy(true);
    const { error } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: `${window.location.origin}/admin` } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up") { toast.success("Vérifiez votre e-mail pour confirmer le compte."); return; }
    nav({ to: "/admin" });
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="font-display text-4xl">{mode === "in" ? "Connexion" : "Créer un compte"}</h1>
      <p className="text-sm text-muted-foreground">Espace réservé aux administrateurs. Les fidèles suivent le direct et les archives sans compte.</p>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" required placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" required minLength={8} placeholder="Mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Se connecter" : "S'inscrire"}</Button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="text-sm text-muted-foreground underline underline-offset-4">
        {mode === "in" ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
      </button>
    </div>
  );
}
