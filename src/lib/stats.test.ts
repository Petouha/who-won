import { describe, expect, it } from 'vitest';
import { computeStandings, headToHead, winnerSide, type MatchLite } from './stats';

let n = 0;
const m = (h: number, a: number, hg: number, ag: number, hp: number | null = null, ap: number | null = null): MatchLite => ({
	id: ++n, playedAt: n, homePlayerId: h, awayPlayerId: a, homeGoals: hg, awayGoals: ag, homePens: hp, awayPens: ap
});

describe('winnerSide', () => {
	it('uses goals first', () => {
		expect(winnerSide(m(1, 2, 3, 1))).toBe('home');
		expect(winnerSide(m(1, 2, 0, 1))).toBe('away');
	});
	it('falls back to penalties, including a 0 penalty score', () => {
		expect(winnerSide(m(1, 2, 1, 1, 0, 3))).toBe('away');
		expect(winnerSide(m(1, 2, 1, 1, 5, 4))).toBe('home');
	});
	it('is a draw without penalties', () => {
		expect(winnerSide(m(1, 2, 2, 2))).toBeNull();
	});
});

describe('computeStandings', () => {
	const matches = [m(1, 2, 2, 0), m(2, 1, 1, 1), m(1, 3, 1, 1, 4, 5), m(3, 2, 0, 3)];
	const s = Object.fromEntries(computeStandings(matches, [1, 2, 3]).map((p) => [p.playerId, p]));

	it('counts results, penalties win included', () => {
		expect(s[1]).toMatchObject({ played: 3, wins: 1, draws: 1, losses: 1, goalsFor: 4, goalsAgainst: 2 });
		expect(s[3]).toMatchObject({ played: 2, wins: 1, losses: 1, goalDiff: -3 });
	});
	it('orders by win rate, then wins, then goal difference', () => {
		const order = computeStandings(matches, [1, 2, 3]).map((p) => p.playerId);
		expect(order).toEqual([3, 1, 2]);
		const tie = computeStandings([m(1, 2, 1, 0), m(3, 4, 3, 0)], [1, 2, 3, 4]).map((p) => p.playerId);
		expect(tie.slice(0, 2)).toEqual([3, 1]);
	});
	it('lists form newest first', () => {
		expect(s[1].form).toEqual(['L', 'D', 'W']);
	});
	it('ignores matches of unknown players', () => {
		expect(computeStandings([m(1, 9, 1, 0)], [1])[0].played).toBe(0);
	});
});

describe('headToHead', () => {
	it('is symmetric in the pair and counts per player', () => {
		const ms = [m(1, 2, 3, 0), m(2, 1, 2, 1), m(1, 2, 1, 1), m(1, 3, 5, 0)];
		expect(headToHead(ms, 1, 2)).toEqual({ played: 3, aWins: 1, bWins: 1, draws: 1, aGoals: 5, bGoals: 3 });
		expect(headToHead(ms, 2, 1)).toEqual({ played: 3, aWins: 1, bWins: 1, draws: 1, aGoals: 3, bGoals: 5 });
	});
});
