import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Confidentialité — Paroisse d'Oran" },
      { name: "description", content: "Comment la paroisse d'Oran traite les enregistrements et les données." },
      { property: "og:title", content: "Confidentialité — Paroisse d'Oran" },
      { property: "og:description", content: "Politique de confidentialité du service de transcription." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <article className="mx-auto max-w-2xl space-y-5 leading-relaxed">
      <h1 className="font-display text-4xl">Confidentialité</h1>
      <p>Seule l'homélie est transcrite, depuis un appareil autorisé par la paroisse et avec le consentement du célébrant.</p>
      <p>L'audio sert uniquement à produire le texte : il n'est ni conservé ni diffusé aux visiteurs. Seuls le texte, sa traduction et le résumé sont publiés.</p>
      <p>Aucun compte n'est demandé aux fidèles. Vos préférences (langue, thème) restent sur votre appareil.</p>
      <p>Pour toute demande de retrait d'un contenu, adressez-vous au secrétariat paroissial.</p>
    </article>
  ),
});
