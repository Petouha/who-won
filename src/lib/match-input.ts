export interface MatchInput {
	homePlayerId: number;
	awayPlayerId: number;
	homeTeamId: number;
	awayTeamId: number;
	homeGoals: number;
	awayGoals: number;
	homePens: number | null;
	awayPens: number | null;
}

export type Parsed = { ok: true; value: MatchInput } | { ok: false; error: string };

const int = (v: FormDataEntryValue | null, min: number, max: number): number | null => {
	if (v === null || String(v).trim() === '') return null;
	const n = Number(v);
	return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

export function parseMatchForm(fd: FormData): Parsed {
	const homePlayerId = int(fd.get('homePlayerId'), 1, 1e9);
	const awayPlayerId = int(fd.get('awayPlayerId'), 1, 1e9);
	const homeTeamId = int(fd.get('homeTeamId'), 1, 1e9);
	const awayTeamId = int(fd.get('awayTeamId'), 1, 1e9);
	const homeGoals = int(fd.get('homeGoals'), 0, 99);
	const awayGoals = int(fd.get('awayGoals'), 0, 99);

	if (homePlayerId === null || awayPlayerId === null) return { ok: false, error: 'Choisis les deux joueurs.' };
	if (homePlayerId === awayPlayerId) return { ok: false, error: 'Les deux joueurs doivent être différents.' };
	if (homeTeamId === null || awayTeamId === null) return { ok: false, error: 'Choisis une équipe pour chaque joueur.' };
	if (homeGoals === null || awayGoals === null) return { ok: false, error: 'Score invalide.' };

	let homePens: number | null = null;
	let awayPens: number | null = null;
	if (fd.get('pens') === 'on') {
		if (homeGoals !== awayGoals) return { ok: false, error: 'Les tirs au but ne comptent qu’en cas d’égalité.' };
		homePens = int(fd.get('homePens'), 0, 99);
		awayPens = int(fd.get('awayPens'), 0, 99);
		if (homePens === null || awayPens === null) return { ok: false, error: 'Score des tirs au but invalide.' };
		if (homePens === awayPens) return { ok: false, error: 'Les tirs au but ne peuvent pas finir à égalité.' };
	}

	return {
		ok: true,
		value: { homePlayerId, awayPlayerId, homeTeamId, awayTeamId, homeGoals, awayGoals, homePens, awayPens }
	};
}
