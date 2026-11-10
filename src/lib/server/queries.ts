import { asc, desc, eq, or } from 'drizzle-orm';
import { db } from './db';
import { match, player, team } from './db/schema';
import type { MatchLite } from '#lib/stats.ts';

export const getPlayers = () => db.select().from(player).orderBy(asc(player.name)).all();
export const getTeams = () => db.select().from(team).orderBy(asc(team.name)).all();
export const getMatches = () => db.select().from(match).orderBy(desc(match.playedAt), desc(match.id)).all();
export const getMatchesOf = (pid: number) =>
	db.select().from(match).where(or(eq(match.homePlayerId, pid), eq(match.awayPlayerId, pid))).orderBy(desc(match.playedAt), desc(match.id)).all();

export const lite = (m: typeof match.$inferSelect): MatchLite => m;

/** Les 5 équipes les plus jouées par chaque joueur : { [playerId]: teamId[] }. */
export function favoriteTeams(): Record<number, number[]> {
	const counts = new Map<number, Map<number, number>>();
	const bump = (p: number, t: number) => {
		const c = counts.get(p) ?? new Map<number, number>();
		c.set(t, (c.get(t) ?? 0) + 1);
		counts.set(p, c);
	};
	for (const m of db.select().from(match).all()) {
		bump(m.homePlayerId, m.homeTeamId);
		bump(m.awayPlayerId, m.awayTeamId);
	}
	return Object.fromEntries(
		[...counts].map(([p, c]) => [p, [...c].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t)])
	);
}

/** Matchs enrichis des noms de joueurs et d'équipes pour l'affichage. */
export function getMatchViews(rows = getMatches()) {
	const players = new Map(getPlayers().map((p) => [p.id, p.name]));
	const teams = new Map(getTeams().map((t) => [t.id, t]));
	return rows.map((m) => ({
		...m,
		homePlayer: players.get(m.homePlayerId) ?? '?',
		awayPlayer: players.get(m.awayPlayerId) ?? '?',
		homeTeam: teams.get(m.homeTeamId)?.name ?? '?',
		awayTeam: teams.get(m.awayTeamId)?.name ?? '?'
	}));
}
