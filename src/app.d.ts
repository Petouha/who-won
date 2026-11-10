import type { Session } from '#lib/server/auth.ts';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
		}
	}
}

export {};
