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

## Synchro des notes d'équipes (à faire)

`data/team_ratings.csv` est l'export FC 25 d'origine : **les notes ne sont pas encore celles de FC 26.** Recherche faite le 10/11/2026 :

- sofifa.com est derrière un challenge Cloudflare interactif (y compris `robots.txt`) : pas de scraping `curl`, pas de navigateur headless fiable.
- `soccerdata` (probberechts) est le seul outil maintenu : il passe par `seleniumbase` (mode UC) mais ne lit que id/nom/ligue, pas les notes.
- Piste retenue : un script d'import qui lit des pages `https://sofifa.com/teams?type=all&r=<version>&set=true&offset=…` **enregistrées depuis un vrai navigateur**, jointure par id sofifa (jamais par nom), `upsert` dans `team`. Les matchs gardent leurs notes d'époque.
