import { fail, redirect } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import { dev } from '$app/env';
import { db } from '#lib/server/db/index.ts';
import { player } from '#lib/server/db/schema.ts';
import {
	checkAccessCode, createSessionToken, recordFailedAttempt,
	SESSION_COOKIE, SESSION_MAX_AGE, tooManyAttempts
} from '#lib/server/auth.ts';

export const load = ({ locals }) => {
	if (locals.session) redirect(303, '/');
	return { players: db.select({ id: player.id, name: player.name }).from(player).orderBy(asc(player.name)).all() };
};

export const actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const ip = getClientAddress();
		if (tooManyAttempts(ip)) return fail(429, { error: 'Trop d’essais, réessaie dans quelques minutes.' });

		const form = await request.formData();
		const code = String(form.get('code') ?? '');
		if (!checkAccessCode(code)) {
			recordFailedAttempt(ip);
			return fail(401, { error: 'Code incorrect.' });
		}

		const pid = Number(form.get('player'));
		const known = Number.isInteger(pid) && pid > 0 && db.select({ id: player.id }).from(player).all().some((p) => p.id === pid);
		cookies.set(SESSION_COOKIE, createSessionToken({ playerId: known ? pid : null }), {
			path: '/', httpOnly: true, sameSite: 'lax', secure: !dev, maxAge: SESSION_MAX_AGE
		});

		const next = url.searchParams.get('next') ?? '/';
		redirect(303, next.startsWith('/') && !next.startsWith('//') ? next : '/');
	}
};
