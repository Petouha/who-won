import { headToHead, winnerSide } from '#lib/stats.ts';
import { getMatchViews, getMatches, getPlayers, lite } from '#lib/server/queries.ts';

export const load = ({ url }) => {
	const players = getPlayers().map((p) => ({ id: p.id, name: p.name }));
	const a = Number(url.searchParams.get('a')) || null;
	const b = Number(url.searchParams.get('b')) || null;
	if (!a || !b || a === b) return { players, a, b, h2h: null, matches: [] };

	const all = getMatches();
	const pair = all.filter((m) => (m.homePlayerId === a && m.awayPlayerId === b) || (m.homePlayerId === b && m.awayPlayerId === a));
	return {
		players, a, b,
		h2h: headToHead(all.map(lite), a, b),
		matches: getMatchViews(pair).slice(0, 10).map((m) => ({ ...m, winner: winnerSide(m) }))
	};
};
