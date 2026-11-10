import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { match, player, team } from '#lib/server/db/schema.ts';
import { parseMatchForm } from '#lib/match-input.ts';
import { favoriteTeams, getPlayers, getTeams } from '#lib/server/queries.ts';

const num = (v: string | null) => (v && Number.isInteger(Number(v)) ? Number(v) : null);

export const load = ({ url, locals }) => ({
	players: getPlayers().map((p) => ({ id: p.id, name: p.name })),
	teams: getTeams().map((t) => ({ id: t.id, name: t.name, league: t.league, overall: t.overall })),
	favorites: favoriteTeams(),
	prefill: {
		home: num(url.searchParams.get('home')) ?? locals.session?.playerId ?? null,
		away: num(url.searchParams.get('away')),
		homeTeam: num(url.searchParams.get('ht')),
		awayTeam: num(url.searchParams.get('at'))
	}
});

export const actions = {
	default: async ({ request, locals }) => {
		const parsed = parseMatchForm(await request.formData());
		if (!parsed.ok) return fail(400, { error: parsed.error });
		const v = parsed.value;

		const [hp, ap] = [v.homePlayerId, v.awayPlayerId].map((id) => db.select({ id: player.id }).from(player).where(eq(player.id, id)).get());
		const [ht, at] = [v.homeTeamId, v.awayTeamId].map((id) => db.select().from(team).where(eq(team.id, id)).get());
		if (!hp || !ap) return fail(400, { error: 'Joueur introuvable.' });
		if (!ht || !at) return fail(400, { error: 'Équipe introuvable.' });

		db.insert(match).values({ ...v, homeRating: ht.overall, awayRating: at.overall, createdBy: locals.session?.playerId ?? null }).run();
		redirect(303, '/history');
	}
};
