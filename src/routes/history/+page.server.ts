import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { match } from '#lib/server/db/schema.ts';
import { getMatches, getMatchesOf, getMatchViews, getPlayers } from '#lib/server/queries.ts';
import { winnerSide } from '#lib/stats.ts';

export const load = ({ url }) => {
	const pid = Number(url.searchParams.get('p')) || null;
	const views = getMatchViews(pid ? getMatchesOf(pid) : getMatches());
	return {
		pid,
		players: getPlayers().map((p) => ({ id: p.id, name: p.name })),
		matches: views.map((m) => ({ ...m, winner: winnerSide(m) }))
	};
};

export const actions = {
	delete: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		if (!Number.isInteger(id)) return fail(400);
		db.delete(match).where(eq(match.id, id)).run();
	}
};
