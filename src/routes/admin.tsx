import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createPairing, revokeDevice, regenerateSummary, claimFirstAdmin } from "@/lib/parish.functions";
import { archivesQuery, eventsQuery } from "@/lib/queries";
import { fmtDate } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administration — Paroisse d'Oran" },
      { name: "description", content: "Tableau de bord de l'équipe paroissiale." },
      { property: "og:title", content: "Administration — Paroisse d'Oran" },
      { property: "og:description", content: "Espace réservé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function useAdminState() {
  return useQuery({
    queryKey: ["me", "admin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { user: null, isAdmin: false };
      const { data } = await supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return { user, isAdmin: !!data };
    },
  });
}

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminState();
  const claim = useServerFn(claimFirstAdmin);

  useEffect(() => { if (!isLoading && !data?.user) nav({ to: "/auth", replace: true }); }, [isLoading, data, nav]);
  if (isLoading || !data?.user) return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin" />;

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  if (!data.isAdmin) return (
    <div className="mx-auto max-w-sm space-y-4 py-16 text-center">
      <p className="font-display text-3xl">Accès restreint</p>
      <p className="text-muted-foreground">Ce compte n'est pas administrateur.</p>
      <Button onClick={async () => {
        const r = await claim().catch((e) => { toast.error(e.message); return null; });
        if (r?.ok) { toast.success("Vous êtes administrateur"); qc.invalidateQueries({ queryKey: ["me"] }); }
        else if (r) toast.error("Un administrateur existe déjà");
      }}>Devenir le premier administrateur</Button>
      <button onClick={signOut} className="block w-full text-sm text-muted-foreground underline">Se déconnecter</button>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Administration</h1>
        <div className="flex gap-2">
          <Button asChild><Link to="/enregistrer">Écran d'enregistrement</Link></Button>
          <Button variant="outline" onClick={signOut}>Déconnexion</Button>
        </div>
      </header>
      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Appareils</TabsTrigger>
          <TabsTrigger value="homilies">Homélies</TabsTrigger>
          <TabsTrigger value="events">Agenda</TabsTrigger>
          <TabsTrigger value="audit">Journal</TabsTrigger>
        </TabsList>
        <TabsContent value="devices"><Devices /></TabsContent>
        <TabsContent value="homilies"><Homilies /></TabsContent>
        <TabsContent value="events"><Events /></TabsContent>
        <TabsContent value="audit"><Audit /></TabsContent>
      </Tabs>
    </div>
  );
}

function Devices() {
  const qc = useQueryClient();
  const create = useServerFn(createPairing);
  const revoke = useServerFn(revokeDevice);
  const [name, setName] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const { data = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => (await supabase.from("devices").select("id,name,paired_at,last_seen_at,revoked_at,can_control,can_transcribe,pairing_expires_at").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-6 pt-4">
      <form className="flex gap-2" onSubmit={async (e) => {
        e.preventDefault();
        try { const r = await create({ data: { name, canTranscribe: true, canControl: true } }); setCode(r.code); setName(""); qc.invalidateQueries({ queryKey: ["devices"] }); }
        catch (err) { toast.error((err as Error).message); }
      }}>
        <Input placeholder="Nom de l'appareil (ex. Tablette autel)" value={name} onChange={(e) => setName(e.target.value)} required />
        <Button>Créer un code</Button>
      </form>
      {code && (
        <div className="rounded-2xl border border-gold bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Sur l'appareil, ouvrez <b>/appareil</b> et saisissez (valable 15 min) :</p>
          <p className="mt-2 font-display text-5xl tracking-[0.3em]">{code}</p>
        </div>
      )}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {data.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.revoked_at ? "Révoqué" : d.paired_at ? `Appairé · vu ${d.last_seen_at ? fmtDate(d.last_seen_at, "fr", { dateStyle: "short", timeStyle: "short" }) : "—"}` : "En attente d'appairage"}
              </p>
            </div>
            {!d.revoked_at && <Button size="sm" variant="outline" onClick={async () => {
              if (!confirm(`Révoquer ${d.name} ?`)) return;
              await revoke({ data: { id: d.id } }); qc.invalidateQueries({ queryKey: ["devices"] });
            }}>Révoquer</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Homilies() {
  const qc = useQueryClient();
  const regen = useServerFn(regenerateSummary);
  const { data = [] } = useQuery(archivesQuery);
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
      {data.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 p-4">
          <Link to="/archives/$id" params={{ id: c.id }}>
            <p className="font-medium">{c.title}</p>
            <p className="text-xs text-muted-foreground">{fmtDate(c.started_at, "fr")} · résumé : {c.summary_status}</p>
          </Link>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" title="Régénérer le résumé" disabled={busy === c.id} onClick={async () => {
              setBusy(c.id);
              try { await regen({ data: { id: c.id } }); toast.success("Résumé régénéré"); } catch (e) { toast.error((e as Error).message); }
              setBusy(null); qc.invalidateQueries({ queryKey: ["celebrations"] });
            }}>{busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" title="Supprimer" onClick={async () => {
              if (!confirm("Supprimer définitivement cette homélie ?")) return;
              const { error } = await supabase.from("celebrations").delete().eq("id", c.id);
              if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["celebrations"] });
            }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Events() {
  const qc = useQueryClient();
  const { data = [] } = useQuery(eventsQuery);
  const [f, setF] = useState({ title: "", kind: "Messe", starts_at: "", location: "", description: "" });
  return (
    <div className="space-y-6 pt-4">
      <form className="grid gap-2 md:grid-cols-2" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.from("events").insert({ ...f, starts_at: new Date(f.starts_at).toISOString(), location: f.location || null, description: f.description || null });
        if (error) { toast.error(error.message); return; }
        setF({ ...f, title: "", description: "" }); qc.invalidateQueries({ queryKey: ["events"] });
      }}>
        <Input required placeholder="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Type" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} />
        <Input required type="datetime-local" value={f.starts_at} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
        <Input placeholder="Lieu" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        <Input className="md:col-span-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Button className="md:col-span-2">Ajouter</Button>
      </form>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {data.map((e) => (
          <li key={e.id} className="flex items-center justify-between p-4">
            <div><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{fmtDate(e.starts_at, "fr", { dateStyle: "medium", timeStyle: "short" })}</p></div>
            <Button size="icon" variant="ghost" onClick={async () => { await supabase.from("events").delete().eq("id", e.id); qc.invalidateQueries({ queryKey: ["events"] }); }}><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Audit() {
  const { data = [] } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => (await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  return (
    <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card text-sm">
      {data.map((a) => (
        <li key={a.id} className="flex justify-between gap-3 p-3">
          <span><b>{a.action}</b> · {a.actor}</span>
          <span className="text-muted-foreground">{fmtDate(a.created_at, "fr", { dateStyle: "short", timeStyle: "short" })}</span>
        </li>
      ))}
    </ul>
  );
}
