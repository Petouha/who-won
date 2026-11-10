import { describe, expect, it } from 'vitest';
import { parseTeamsPage } from './parse-teams.ts';
import { parseTeamsCsv, stringifyTeamsCsv } from './teams-csv.ts';

const row = (id: number, name: string, league: string, oa: number, at: number, md: number, df: number) =>
	`<tr><td class="a1"></td><td class="s20"><a href="/team/${id}/x/260046/">${name}</a><br><a href="/teams?as=6" class="sub">${league}</a></td>` +
	`<td data-col="oa"><em title="${oa}">${oa}</em></td><td data-col="at"><em>${at}</em></td><td data-col="md"><em>${md}</em></td><td data-col="df"><em>${df}</em></td><td data-col="tb">€0</td></tr>`;

const page = (rows: string, pagination: string, title = 'FC26 - Clubs | SoFIFA') =>
	`<html><head><title>${title}</title></head><body>
	<select name="roster"><option value="/teams?col=oa&sort=desc&r=260046&set=true" selected>23 juil. 2026</option><option value="/teams?r=260045">16 juil. 2026</option></select>
	<table><thead><tr><th>Nom</th></tr></thead><tbody>${rows}</tbody></table><div class="pagination">${pagination}</div></body></html>`;

const next = (o: number) => `<a href="/teams?col=oa&r=260046&offset=${o}" class="button">Suivant <svg/></a>`;
const prev = (o: number) => `<a href="/teams?col=oa&r=260046&offset=${o}" class="button">Précédent</a>`;

describe('parseTeamsPage', () => {
	const rows = row(1335, 'France', 'UEFA', 86, 87, 86, 84) + row(73, 'Paris Saint-Germain', "Ligue 1 McDonald's", 85, 85, 86, 86);

	it('reads teams, ratings and update', () => {
		const p = parseTeamsPage(page(rows, next(2)));
		expect(p.teams[1]).toEqual({ sourceId: 73, name: 'Paris Saint-Germain', league: "Ligue 1 McDonald's", overall: 85, attack: 85, midfield: 86, defence: 86 });
		expect(p.updateId).toBe('260046');
		expect(p.updateLabel).toBe('23 juil. 2026');
	});
	it('derives the page offset from pagination links', () => {
		expect(parseTeamsPage(page(rows, next(2))).offset).toBe(0); // 2 lignes, suivant = 2
		expect(parseTeamsPage(page(rows, prev(0) + next(152))).offset).toBe(150);
		const last = parseTeamsPage(page(rows, prev(600)));
		expect(last).toMatchObject({ hasNext: false, offset: 675 });
	});
	it('rejects Cloudflare pages, empty pages and unreadable rows', () => {
		expect(() => parseTeamsPage(page(rows, '', 'Just a moment...'))).toThrow(/Cloudflare/);
		expect(() => parseTeamsPage(page('', next(75)))).toThrow(/Aucune équipe/);
		expect(() => parseTeamsPage(page(row(5, 'Broken', 'L', 80, 80, 80, 80).replace('data-col="df"><em>80', 'data-col="df"><em>n/a'), ''))).toThrow(/illisible/);
	});
});

describe('teams csv', () => {
	it('round-trips names with commas and quotes', () => {
		const teams = [
			{ sourceId: 1, name: 'Club, with comma', league: 'L"1"', overall: 80, attack: 81, midfield: 82, defence: 83 },
			{ sourceId: 2, name: 'Plain', league: 'Premier League', overall: 70, attack: 71, midfield: 72, defence: 73 }
		];
		expect(parseTeamsCsv(stringifyTeamsCsv(teams))).toEqual(teams);
	});
	it('reads the legacy file format and rejects bad lines', () => {
		expect(parseTeamsCsv('id,name,league,overall,attack,midfield,defence\n10,Manchester City,Premier League,85,86,83,79\n')[0].sourceId).toBe(10);
		expect(() => parseTeamsCsv('id,name,league,overall,attack,midfield,defence\n10,X,L,abc,1,1,1\n')).toThrow(/ligne 2/);
	});
});
