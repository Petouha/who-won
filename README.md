# Who Won

Suivi des matchs FIFA (EA FC 26) entre amis : saisie rapide, historique, classement, face-à-face, tirage d'équipes équilibrées.

> L'ancienne version Flask est conservée dans [`legacy/`](legacy/) pour référence.

## Stack

SvelteKit 3 (Svelte 5, TypeScript) · SQLite (`better-sqlite3`) + Drizzle ORM · `adapter-node` · Vitest.
Un seul process Node (~100 Mo de RAM) sert le front et le « backend ».

## Lancer en local

```bash
npm install
npm run dev          # http://localhost:5173, code d'accès par défaut : « dev »
npm test             # logique de stats, validation de saisie, randomizer
npm run check        # types
```

La base (`data/who-won.db`) est créée au premier lancement : migrations appliquées automatiquement, 688 équipes importées depuis `data/team_ratings.csv`.

## Modèle de données

- `player` : nom unique (insensible à la casse) ; `password_hash`/`role` déjà là pour de futurs comptes.
- `team` : équipes avec leurs notes (global, attaque, milieu, défense), id sofifa en `source_id`.
- `match` : 1v1, buts, tirs au but optionnels, note des équipes *au moment du match*. Contraintes SQL (joueurs différents, buts ≥ 0, tirs au but cohérents).

Le vainqueur n'est jamais stocké. Classement et face-à-face sont calculés depuis `match` (`src/lib/stats.ts`), donc modifier ou supprimer un match ne désynchronise rien.

## Accès

Tout le site est derrière un code partagé (`ACCESS_CODE`), puis un cookie signé HMAC (90 jours). À l'entrée on peut dire « qui on est » : ça pré-remplit la saisie et trace l'auteur des matchs. 10 essais de code ratés par 10 minutes et par IP, puis blocage temporaire.

## Déploiement (Node derrière Caddy)

```bash
npm ci && npm run build                 # sur ta machine, jamais sur le serveur
rsync -a build drizzle data/team_ratings.csv package.json package-lock.json user@serveur:/opt/who-won/
# sur le serveur : npm ci --omit=dev
```

Variables d'environnement (voir `.env.example`) : `ACCESS_CODE`, `SESSION_SECRET`, **`ORIGIN`** (l'URL publique en https, sinon SvelteKit refuse les formulaires), `PORT`, `DATABASE_URL`. Lancer avec `node build` sous systemd ; Caddy fait `reverse_proxy localhost:3000`. Sauvegarde : copier `data/who-won.db` (SQLite en mode WAL : utiliser `sqlite3 .backup`).

## Synchro des notes d'équipes

sofifa est protégé par Cloudflare : un script ne peut pas télécharger les pages seul. On enregistre donc les pages depuis un navigateur, et un script les transforme en CSV.

1. Ouvre https://sofifa.com/teams?col=oa&sort=desc&set=true (la version affichée par défaut est la plus récente ; vérifie la date dans la liste « mise à jour »).
2. Enregistre la page : clic droit, « Enregistrer sous… », type **Page web, HTML uniquement**, dans `data/sofifa-pages/`.
3. Clique sur « Suivant » et recommence, jusqu'à la page qui n'a plus de bouton « Suivant » (≈ 10 pages de 75 équipes).
4. `npm run sync:teams -- --dry` pour vérifier (pages manquantes, mélange de mises à jour, notes modifiées), puis `npm run sync:teams` pour écrire `data/team_ratings.csv` et `data/team_ratings.meta.json`.
5. Commite ces deux fichiers. Au démarrage, l'app met à jour ses équipes depuis le CSV, par id sofifa : nouvelles notes, aucune suppression. Les matchs déjà joués gardent la note de l'époque.

Le script refuse d'écrire s'il manque beaucoup d'équipes ou si les pages viennent de plusieurs mises à jour. Un ancien essai d'automatisation (Playwright, voir le fork `sofifa-web-scraper`) est bloqué par Cloudflare depuis novembre 2026.
