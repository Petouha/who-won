import { describe, expect, it } from 'vitest';
import { parseMatchForm } from './match-input';

const form = (o: Record<string, string>) => {
	const fd = new FormData();
	const base = { homePlayerId: '1', awayPlayerId: '2', homeTeamId: '10', awayTeamId: '20', homeGoals: '1', awayGoals: '1' };
	for (const [k, v] of Object.entries({ ...base, ...o })) fd.set(k, v);
	return fd;
};

describe('parseMatchForm', () => {
	it('accepts a plain match', () => {
		expect(parseMatchForm(form({ homeGoals: '3', awayGoals: '2' }))).toMatchObject({ ok: true, value: { homeGoals: 3, homePens: null } });
	});
	it('rejects same player and bad scores', () => {
		expect(parseMatchForm(form({ awayPlayerId: '1' })).ok).toBe(false);
		expect(parseMatchForm(form({ homeGoals: '-1' })).ok).toBe(false);
		expect(parseMatchForm(form({ homeGoals: '1.5' })).ok).toBe(false);
	});
	it('accepts a 0 penalty score on a draw', () => {
		expect(parseMatchForm(form({ pens: 'on', homePens: '0', awayPens: '3' }))).toMatchObject({ ok: true, value: { homePens: 0, awayPens: 3 } });
	});
	it('rejects penalties when not a draw or tied shootout', () => {
		expect(parseMatchForm(form({ homeGoals: '2', pens: 'on', homePens: '3', awayPens: '1' })).ok).toBe(false);
		expect(parseMatchForm(form({ pens: 'on', homePens: '3', awayPens: '3' })).ok).toBe(false);
		expect(parseMatchForm(form({ pens: 'on', homePens: '', awayPens: '3' })).ok).toBe(false);
	});
});
