import { computeStandings, winnerSide } from '#lib/stats.ts';
import { getMatches, getMatchViews, getPlayers, lite } from '#lib/server/queries.ts';

export const load = () => {
	const players = getPlayers();
	const matches = getMatches();
	const names = new Map(players.map((p) => [p.id, p.name]));
	const standings = computeStandings(matches.map(lite), players.map((p) => p.id))
		.filter((s) => s.played > 0)
		.slice(0, 3)
		.map((s) => ({ ...s, name: names.get(s.playerId) ?? '?' }));
	const recent = getMatchViews(matches.slice(0, 5)).map((m) => ({ ...m, winner: winnerSide(m) }));
	return { standings, recent, totalMatches: matches.length, totalPlayers: players.length };
};
