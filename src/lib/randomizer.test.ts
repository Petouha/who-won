import { describe, expect, it } from 'vitest';
import { pickMatchup, type PoolTeam } from './randomizer';

const t = (id: number, overall: number, league = 'L'): PoolTeam => ({ id, name: `T${id}`, league, overall });

describe('pickMatchup', () => {
	it('respects range and max diff over many draws', () => {
		const teams = [t(1, 70), t(2, 71), t(3, 80), t(4, 81), t(5, 90)];
		for (let i = 0; i < 200; i++) {
			const [a, b] = pickMatchup(teams, { min: 70, max: 81, maxDiff: 1 })!;
			expect(a.id).not.toBe(b.id);
			expect(Math.abs(a.overall - b.overall)).toBeLessThanOrEqual(1);
			expect(a.overall).toBeLessThanOrEqual(81);
		}
	});
	it('finds the only valid pair even if most draws start isolated', () => {
		const teams = [t(1, 60), t(2, 70), t(3, 80), t(4, 81)];
		for (let i = 0; i < 50; i++) {
			expect(pickMatchup(teams, { min: 60, max: 90, maxDiff: 1 })!.map((x) => x.id).sort()).toEqual([3, 4]);
		}
	});
	it('returns null when impossible and filters by league', () => {
		expect(pickMatchup([t(1, 70), t(2, 80)], { min: 60, max: 90, maxDiff: 2 })).toBeNull();
		expect(pickMatchup([t(1, 70, 'A'), t(2, 70, 'B'), t(3, 70, 'B')], { min: 60, max: 90, maxDiff: 0, leagues: ['A'] })).toBeNull();
	});
});
