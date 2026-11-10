import { fail } from '@sveltejs/kit';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { match, player } from '#lib/server/db/schema.ts';
import { computeStandings } from '#lib/stats.ts';
import { getMatches, getPlayers, lite } from '#lib/server/queries.ts';

export const load = () => {
	const players = getPlayers();
	const stats = new Map(computeStandings(getMatches().map(lite), players.map((p) => p.id)).map((s) => [s.playerId, s]));
	return { players: players.map((p) => ({ id: p.id, name: p.name, played: stats.get(p.id)?.played ?? 0, elo: stats.get(p.id)?.elo ?? 1000 })) };
};

export const actions = {
	add: async ({ request }) => {
		const name = String((await request.formData()).get('name') ?? '').trim().replace(/\s+/g, ' ');
		if (!name) return fail(400, { error: 'Le nom est requis.', name });
		if (name.length > 40) return fail(400, { error: 'Nom trop long (40 max).', name });
		const exists = db.select({ id: player.id }).from(player).where(sql`lower(${player.name}) = ${name.toLowerCase()}`).get();
		if (exists) return fail(409, { error: `« ${name} » existe déjà.`, name });
		db.insert(player).values({ name }).run();
		return { added: name };
	},
	remove: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		const used = db.select({ id: match.id }).from(match).where(or(eq(match.homePlayerId, id), eq(match.awayPlayerId, id))).get();
		if (used) return fail(409, { error: 'Ce joueur a des matchs, impossible de le supprimer.' });
		db.delete(player).where(eq(player.id, id)).run();
		return { removed: true };
	}
};
