import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { building } from '$app/env';
import * as schema from './schema';
import { parseTeamsCsv } from './teams-csv';

// Pendant `vite build`, SvelteKit importe ce module pour analyser les routes : base en mémoire, rien sur disque.
const file = building ? ':memory:' : (process.env.DATABASE_URL ?? 'data/who-won.db');
if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
const sqlite = new Database(file);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Les migrations s'appliquent au démarrage : un déploiement = copier le build et relancer.
migrate(db, { migrationsFolder: process.env.MIGRATIONS_DIR ?? 'drizzle' });

// Premier lancement : on charge les équipes depuis le CSV (la synchro sofifa viendra plus tard).
if (!building && db.select({ id: schema.team.id }).from(schema.team).limit(1).all().length === 0) {
	const rows = parseTeamsCsv(readFileSync(process.env.TEAMS_CSV ?? 'data/team_ratings.csv', 'utf-8'));
	db.insert(schema.team).values(rows).run();
}
