# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

## Hébergement Netlify

Connecter le dépôt Git dans Netlify. `netlify.toml` définit `npm run build`, Node 22 et le dossier publié `dist`. Le réglage `NETLIFY=true` fourni automatiquement par Netlify sélectionne le déploiement Nitro `netlify`, qui produit les fonctions serveur et les règles de routage dans `.netlify/v1/`. Ne pas utiliser une redirection générale vers `index.html` ni un simple dépôt des fichiers statiques : la transcription et les résumés nécessitent les fonctions serveur.

Configurer les valeurs publiques `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` et `VITE_SUPABASE_PROJECT_ID` pour le backend cible avant la compilation. Autoriser aussi l’adresse HTTPS Netlify dans les redirections de connexion du backend.

**Limite importante :** les fonctions d’administration dépendent d’un accès serveur privilégié et l’IA d’un accès au service IA. Les secrets gérés par Lovable Cloud ne sont pas automatiquement transférés vers Netlify, et la clé privilégiée de Lovable Cloud n’est pas accessible à l’utilisateur. La configuration d’hébergement seule ne permet donc pas de garantir les fonctions d’administration et d’IA sur un hébergeur externe. Prévoir une migration vers un backend dont les accès serveur sont disponibles et configurer les accès IA compatibles avant la mise en service. Ne jamais placer un secret dans une variable `VITE_*`.

Le déploiement réel Netlify doit encore être vérifié : ouverture directe et actualisation de `/`, `/direct`, `/archives`, `/agenda`, connexion administrateur, transcription, traduction et résumé. Les protections d’erreur couvrent les échecs de chargement et d’affichage dans l’application ; aucune application ne peut garantir l’affichage si l’hébergeur ou le navigateur est indisponible.

- TanStack Start
- TypeScript
- React
- Tailwind CSS
