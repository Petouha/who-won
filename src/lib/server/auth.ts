import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { building, dev } from '$app/env';

try {
	process.loadEnvFile('.env');
} catch {
	// Pas de fichier .env : on utilise l'environnement du process (systemd en prod).
}

const ACCESS_CODE = process.env.ACCESS_CODE ?? (dev ? 'dev' : '');
const SECRET = process.env.SESSION_SECRET ?? (dev ? 'dev-secret-change-me' : '');
if (!building && (!ACCESS_CODE || !SECRET)) {
	throw new Error('ACCESS_CODE et SESSION_SECRET doivent être définis (voir .env.example)');
}

export const SESSION_COOKIE = 'ww_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

export interface Session {
	/** Joueur "connecté" (pour pré-remplir, tracer l'auteur) ; null = accès par code seulement. */
	playerId: number | null;
}

const sign = (payload: string) => createHmac('sha256', SECRET).update(payload).digest('base64url');
const digest = (s: string) => createHash('sha256').update(s).digest();

export function checkAccessCode(input: string): boolean {
	return timingSafeEqual(digest(input), digest(ACCESS_CODE));
}

export function createSessionToken(session: Session): string {
	const payload = Buffer.from(
		JSON.stringify({ p: session.playerId, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
	).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): Session | null {
	if (!token) return null;
	const [payload, sig] = token.split('.');
	if (!payload || !sig) return null;
	const expected = Buffer.from(sign(payload));
	const given = Buffer.from(sig);
	if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
	try {
		const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
		if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
		return { playerId: typeof data.p === 'number' ? data.p : null };
	} catch {
		return null;
	}
}

// Limite les essais de code par IP : 10 tentatives / 10 minutes (en mémoire, suffisant pour 1 process).
const attempts = new Map<string, number[]>();
export function tooManyAttempts(ip: string): boolean {
	const now = Date.now();
	const recent = (attempts.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
	attempts.set(ip, recent);
	return recent.length >= 10;
}
export function recordFailedAttempt(ip: string) {
	attempts.set(ip, [...(attempts.get(ip) ?? []), Date.now()]);
}
