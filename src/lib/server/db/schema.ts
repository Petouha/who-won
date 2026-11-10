import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch())`;

/**
 * Un joueur. C'est aussi, à terme, un compte : tant que `passwordHash` est NULL,
 * le joueur n'est qu'un nom dans le classement (accès via le code partagé).
 */
export const player = sqliteTable(
	'player',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		name: text().notNull(),
		passwordHash: text('password_hash'),
		role: text({ enum: ['member', 'admin'] })
			.notNull()
			.default('member'),
		createdAt: integer('created_at').notNull().default(now)
	},
	(t) => [uniqueIndex('player_name_uq').on(sql`lower(${t.name})`)]
);

/** Équipes de EA FC 26 (importées depuis sofifa). `sourceId` = id sofifa. */
export const team = sqliteTable(
	'team',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		sourceId: integer('source_id').notNull(),
		name: text().notNull(),
		league: text().notNull(),
		overall: integer().notNull(),
		attack: integer().notNull(),
		midfield: integer().notNull(),
		defence: integer().notNull(),
		updatedAt: integer('updated_at').notNull().default(now)
	},
	(t) => [
		uniqueIndex('team_source_uq').on(t.sourceId),
		index('team_overall_idx').on(t.overall)
	]
);

/**
 * Un match 1v1. Le vainqueur n'est PAS stocké : il se déduit des buts, puis des
 * tirs au but. Toutes les stats sont calculées à partir de cette table.
 */
export const match = sqliteTable(
	'match',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		playedAt: integer('played_at').notNull().default(now),

		homePlayerId: integer('home_player_id')
			.notNull()
			.references(() => player.id),
		awayPlayerId: integer('away_player_id')
			.notNull()
			.references(() => player.id),
		homeTeamId: integer('home_team_id')
			.notNull()
			.references(() => team.id),
		awayTeamId: integer('away_team_id')
			.notNull()
			.references(() => team.id),

		homeGoals: integer('home_goals').notNull(),
		awayGoals: integer('away_goals').notNull(),
		// Tirs au but : les deux colonnes sont NULL, ou aucune des deux.
		homePens: integer('home_pens'),
		awayPens: integer('away_pens'),

		// Note de l'équipe au moment du match (la synchro des ratings ne doit pas réécrire l'histoire).
		homeRating: integer('home_rating').notNull(),
		awayRating: integer('away_rating').notNull(),

		createdBy: integer('created_by').references(() => player.id)
	},
	(t) => [
		check('players_differ', sql`${t.homePlayerId} <> ${t.awayPlayerId}`),
		check('goals_non_negative', sql`${t.homeGoals} >= 0 AND ${t.awayGoals} >= 0`),
		check(
			'pens_consistent',
			sql`(${t.homePens} IS NULL AND ${t.awayPens} IS NULL)
				OR (${t.homePens} IS NOT NULL AND ${t.awayPens} IS NOT NULL
					AND ${t.homeGoals} = ${t.awayGoals}
					AND ${t.homePens} >= 0 AND ${t.awayPens} >= 0
					AND ${t.homePens} <> ${t.awayPens})`
		),
		index('match_played_at_idx').on(t.playedAt),
		index('match_home_player_idx').on(t.homePlayerId),
		index('match_away_player_idx').on(t.awayPlayerId)
	]
);

export type Player = typeof player.$inferSelect;
export type Team = typeof team.$inferSelect;
export type Match = typeof match.$inferSelect;
