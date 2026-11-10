import { getTeams } from '#lib/server/queries.ts';

export const load = () => ({
	teams: getTeams().map((t) => ({ id: t.id, name: t.name, league: t.league, overall: t.overall }))
});
