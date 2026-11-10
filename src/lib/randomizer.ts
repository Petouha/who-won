export interface PoolTeam {
	id: number;
	name: string;
	league: string;
	overall: number;
}

export interface RandomizerOptions {
	min: number;
	max: number;
	/** Écart maximal de note entre les deux équipes. */
	maxDiff: number;
	/** Vide = toutes les ligues. */
	leagues?: string[];
}

const shuffle = <T>(xs: T[], rng: () => number): T[] => {
	const a = [...xs];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
};

/** Tire deux équipes respectant les filtres et l'écart de note, ou null si c'est impossible. */
export function pickMatchup<T extends PoolTeam>(teams: T[], o: RandomizerOptions, rng = Math.random): [T, T] | null {
	const pool = teams.filter(
		(t) => t.overall >= o.min && t.overall <= o.max && (!o.leagues?.length || o.leagues.includes(t.league))
	);
	for (const a of shuffle(pool, rng)) {
		const candidates = pool.filter((b) => b.id !== a.id && Math.abs(b.overall - a.overall) <= o.maxDiff);
		if (candidates.length) return [a, candidates[Math.floor(rng() * candidates.length)]];
	}
	return null;
}
