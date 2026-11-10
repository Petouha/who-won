export interface MatchLite {
	id: number;
	playedAt: number;
	homePlayerId: number;
	awayPlayerId: number;
	homeGoals: number;
	awayGoals: number;
	homePens: number | null;
	awayPens: number | null;
}

export type Side = 'home' | 'away';
export type Result = 'W' | 'D' | 'L';

/** Vainqueur d'un match : les buts, puis les tirs au but. `null` = match nul. */
export function winnerSide(m: MatchLite): Side | null {
	if (m.homeGoals !== m.awayGoals) return m.homeGoals > m.awayGoals ? 'home' : 'away';
	if (m.homePens !== null && m.awayPens !== null && m.homePens !== m.awayPens) {
		return m.homePens > m.awayPens ? 'home' : 'away';
	}
	return null;
}

export function resultFor(m: MatchLite, playerId: number): Result {
	const w = winnerSide(m);
	if (w === null) return 'D';
	const side: Side = m.homePlayerId === playerId ? 'home' : 'away';
	return w === side ? 'W' : 'L';
}

export interface PlayerStats {
	playerId: number;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	goalDiff: number;
	/** 0..100 */
	winRate: number;
	/** Du plus récent au plus ancien, 5 max. */
	form: Result[];
}

const chronological = (a: MatchLite, b: MatchLite) => a.playedAt - b.playedAt || a.id - b.id;

export function computeStandings(matches: MatchLite[], playerIds: number[]): PlayerStats[] {
	const stats = new Map<number, PlayerStats>();
	for (const id of playerIds) {
		stats.set(id, {
			playerId: id, played: 0, wins: 0, draws: 0, losses: 0,
			goalsFor: 0, goalsAgainst: 0, goalDiff: 0, winRate: 0, form: []
		});
	}

	for (const m of [...matches].sort(chronological)) {
		const home = stats.get(m.homePlayerId);
		const away = stats.get(m.awayPlayerId);
		if (!home || !away) continue;

		for (const [p, gf, ga, r] of [
			[home, m.homeGoals, m.awayGoals, resultFor(m, m.homePlayerId)],
			[away, m.awayGoals, m.homeGoals, resultFor(m, m.awayPlayerId)]
		] as const) {
			p.played++;
			p.goalsFor += gf;
			p.goalsAgainst += ga;
			if (r === 'W') p.wins++;
			else if (r === 'D') p.draws++;
			else p.losses++;
			p.form.unshift(r);
		}
	}

	for (const p of stats.values()) {
		p.goalDiff = p.goalsFor - p.goalsAgainst;
		p.winRate = p.played ? (p.wins / p.played) * 100 : 0;
		p.form = p.form.slice(0, 5);
	}
	return [...stats.values()].sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || b.goalDiff - a.goalDiff);
}

export interface HeadToHead {
	played: number;
	aWins: number;
	bWins: number;
	draws: number;
	aGoals: number;
	bGoals: number;
}

export function headToHead(matches: MatchLite[], a: number, b: number): HeadToHead {
	const h: HeadToHead = { played: 0, aWins: 0, bWins: 0, draws: 0, aGoals: 0, bGoals: 0 };
	for (const m of matches) {
		const pair =
			(m.homePlayerId === a && m.awayPlayerId === b) ||
			(m.homePlayerId === b && m.awayPlayerId === a);
		if (!pair) continue;
		h.played++;
		const r = resultFor(m, a);
		if (r === 'W') h.aWins++;
		else if (r === 'L') h.bWins++;
		else h.draws++;
		h.aGoals += m.homePlayerId === a ? m.homeGoals : m.awayGoals;
		h.bGoals += m.homePlayerId === a ? m.awayGoals : m.homeGoals;
	}
	return h;
}
