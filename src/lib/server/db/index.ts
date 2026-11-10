import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { building } from '$app/env';
import * as schema from './schema';
import { parseTeamsCsv } from '../../sofifa/teams-csv.ts';

// Pendant `vite build`, SvelteKit importe ce module pour analyser les routes : base en mémoire, rien sur disque.
const file = building ? ':memory:' : (process.env.DATABASE_URL ?? 'data/who-won.db');
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
const sqlite = new Database(file);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Les migrations s'appliquent au démarrage : un déploiement = copier le build et relancer.
migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' });

// Les équipes viennent de data/team_ratings.csv (produit par `npm run sync:teams`).
// À chaque démarrage on les met à jour par id sofifa : nouvelles notes, jamais de suppression
// (les matchs référencent les équipes, et gardent de toute façon la note de leur époque).
if (!building) {
	const rows = parseTeamsCsv(readFileSync(process.env.TEAMS_CSV ?? 'data/team_ratings.csv', 'utf-8'));
	db.transaction((tx) => {
		for (const r of rows) {
			tx.insert(schema.team)
				.values(r)
				.onConflictDoUpdate({
					target: schema.team.sourceId,
					set: { name: r.name, league: r.league, overall: r.overall, attack: r.attack, midfield: r.midfield, defence: r.defence, updatedAt: sql`(unixepoch())` }
				})
				.run();
		}
	});
}
