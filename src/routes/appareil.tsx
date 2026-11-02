import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { redeemPairing } from "@/lib/parish.functions";
import { DEVICE_TOKEN_KEY } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/appareil")({
  head: () => ({
    meta: [
      { title: "Appairer un appareil — Paroisse d'Oran" },
      { name: "description", content: "Autoriser cet appareil à transcrire les homélies." },
      { property: "og:title", content: "Appairer un appareil — Paroisse d'Oran" },
      { property: "og:description", content: "Autoriser un appareil de la paroisse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Pair,
});

function Pair() {
  const redeem = useServerFn(redeemPairing);
  const [code, setCode] = useState("");
  const [paired, setPaired] = useState(false);
  useEffect(() => setPaired(!!localStorage.getItem(DEVICE_TOKEN_KEY)), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const r = await redeem({ data: { code } });
      localStorage.setItem(DEVICE_TOKEN_KEY, r.token);
      setPaired(true);
      toast.success(`Appareil « ${r.name} » autorisé`);
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="font-display text-4xl">Appareil</h1>
      {paired ? (
        <div className="space-y-4">
          <p>Cet appareil est autorisé à transcrire.</p>
          <Button asChild className="w-full"><Link to="/enregistrer">Ouvrir l'écran d'enregistrement</Link></Button>
          <button className="text-sm text-muted-foreground underline" onClick={() => { localStorage.removeItem(DEVICE_TOKEN_KEY); setPaired(false); }}>Oublier cet appareil</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-muted-foreground">Saisissez le code à 6 chiffres fourni par l'administrateur.</p>
          <Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" className="text-center text-2xl tracking-[0.4em]" />
          <Button className="w-full">Autoriser</Button>
        </form>
      )}
    </div>
  );
}
