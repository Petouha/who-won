import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { readSessionToken, SESSION_COOKIE } from '#lib/server/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const session = readSessionToken(event.cookies.get(SESSION_COOKIE));
	event.locals.session = session;

	if (!session && event.url.pathname !== '/access') {
		const next = event.url.pathname + event.url.search;
		redirect(303, `/access?next=${encodeURIComponent(next)}`);
	}
	return resolve(event);
};
