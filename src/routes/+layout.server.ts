import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { player } from '#lib/server/db/schema.ts';

export const load = ({ locals }) => {
	const id = locals.session?.playerId;
	const me = id ? db.select().from(player).where(eq(player.id, id)).get() : undefined;
	return { me: me ? { id: me.id, name: me.name } : null, authed: !!locals.session };
};
