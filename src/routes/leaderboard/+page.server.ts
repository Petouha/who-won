import { computeStandings } from '#lib/stats.ts';
import { getMatches, getPlayers, lite } from '#lib/server/queries.ts';

export const load = () => {
	const players = getPlayers();
	const names = new Map(players.map((p) => [p.id, p.name]));
	const rows = computeStandings(getMatches().map(lite), players.map((p) => p.id)).map((s) => ({ ...s, name: names.get(s.playerId) ?? '?' }));
	return { rows };
};
