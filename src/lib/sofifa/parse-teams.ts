import { parse, type HTMLElement } from 'node-html-parser';
import type { TeamRow } from './teams-csv.ts';

export type Layout = 'desktop' | 'mobile';

/** Nombre d'équipes par page de la liste sofifa selon la mise en page servie. */
export const PAGE_SIZES: Record<Layout, number> = { desktop: 75, mobile: 20 };

export interface ParsedTeamsPage {
	teams: TeamRow[];
	/** sofifa sert un tableau (desktop, 75 par page) ou une liste (mobile, 20 par page). */
	layout: Layout;
	/** Offset de cette page dans la liste (0, 75, 150… ou 0, 20, 40…), déduit des liens de pagination. */
	offset: number;
	/** Y a-t-il une page suivante ? `false` = c'est la dernière page. */
	hasNext: boolean;
	/** Identifiant de la mise à jour du jeu affichée (paramètre `r=` de sofifa), ex. "260046". */
	updateId: string | null;
	/** Date de cette mise à jour telle qu'affichée par sofifa, ex. "23 juil. 2026". */
	updateLabel: string | null;
}

const offsetOf = (href: string | undefined) => {
	const m = href?.match(/[?&]offset=(\d+)/);
	return m ? Number(m[1]) : null;
};

const num = (el: HTMLElement | null | undefined) => Number(el?.text.trim());

function fromTable(rows: HTMLElement[]): TeamRow[] {
	const teams: TeamRow[] = [];
	for (const row of rows) {
		const link = row.querySelector('td.s20 a[href^="/team/"]');
		if (!link) continue;
		const rating = (col: string) => num(row.querySelector(`td[data-col="${col}"] em`));
		teams.push(check({
			sourceId: Number(link.getAttribute('href')?.match(/^\/team\/(\d+)/)?.[1]),
			name: link.text.trim(),
			league: row.querySelector('td.s20 a.sub')?.text.trim() ?? '',
			overall: rating('oa'), attack: rating('at'), midfield: rating('md'), defence: rating('df')
		}));
	}
	return teams;
}

/** Mise en page mobile : un <li> par équipe, « 87 ATT 86 MIL 84 DEF » (chaque note précède son libellé). */
function fromList(items: HTMLElement[]): TeamRow[] {
	const teams: TeamRow[] = [];
	for (const li of items) {
		const link = li.querySelector('a[href^="/team/"]');
		if (!link) continue;

		const found: Partial<Record<'attack' | 'midfield' | 'defence', number>> = {};
		for (const box of li.querySelectorAll('div')) {
			if (!box.querySelector('abbr') || !box.querySelector('em')) continue;
			let last = NaN;
			for (const node of box.childNodes) {
				const el = node as HTMLElement;
				if (el.tagName === 'EM') last = num(el);
				else if (el.tagName === 'ABBR') {
					const label = el.text.trim().toLowerCase();
					if (/^(att|atk)/.test(label)) found.attack = last;
					else if (/^(mil|mid)/.test(label)) found.midfield = last;
					else if (/^(def|déf)/.test(label)) found.defence = last;
				}
			}
		}
		const leagueLinks = li.querySelectorAll('div.pure-u-1-1 a').filter((a) => a.text.trim());
		teams.push(check({
			sourceId: Number(link.getAttribute('href')?.match(/^\/team\/(\d+)/)?.[1]),
			name: link.text.trim(),
			league: leagueLinks.at(-1)?.text.trim() ?? '',
			overall: num(li.querySelector('em[title]')),
			attack: found.attack ?? NaN, midfield: found.midfield ?? NaN, defence: found.defence ?? NaN
		}));
	}
	return teams;
}

function check(t: TeamRow): TeamRow {
	const bad = Object.entries(t).find(([k, v]) => (k === 'name' || k === 'league' ? !v : !Number.isInteger(v)));
	if (bad) throw new Error(`Ligne illisible pour « ${t.name || '?'} » (champ ${bad[0]}). Le format de sofifa a peut-être changé.`);
	return t;
}

/** Lit une page « sofifa.com/teams » (tableau desktop ou liste mobile, interface en français ou en anglais). */
export function parseTeamsPage(html: string): ParsedTeamsPage {
	const root = parse(html);

	const title = root.querySelector('title')?.text ?? '';
	if (/just a moment|un instant|checking your browser/i.test(title)) {
		throw new Error('C’est la page de vérification Cloudflare, pas la liste des équipes.');
	}

	const tableRows = root.querySelectorAll('table tbody tr');
	const layout: Layout = tableRows.length ? 'desktop' : 'mobile';
	const teams = layout === 'desktop' ? fromTable(tableRows) : fromList(root.querySelectorAll('ul.list li.pure-g'));
	if (teams.length === 0) throw new Error('Aucune équipe trouvée dans cette page.');

	// Pagination : « Suivant/Next » et « Précédent/Previous » sont des liens ?offset=N (le « Précédent » de la 1re page est un bouton sans lien).
	let next: number | null = null;
	let prev: number | null = null;
	for (const a of root.querySelectorAll('a')) {
		const off = offsetOf(a.getAttribute('href'));
		if (off === null) continue;
		const text = a.text.trim().toLowerCase();
		if (/^(suivant|next)/.test(text)) next = off;
		else if (/^(pr[ée]c[ée]dent|previous|prev)/.test(text)) prev = off;
	}
	const size = PAGE_SIZES[layout];
	const offset = next !== null ? next - teams.length : prev !== null ? prev + size : 0;

	// Mise à jour affichée : liste « roster » (desktop), sinon l'id présent dans les liens d'équipe /team/<id>/<nom>/<mise à jour>/.
	const selected = root.querySelector('select[name="roster"] option[selected]');
	const updateId =
		selected?.getAttribute('value')?.match(/[?&]r=(\d+)/)?.[1] ??
		root.querySelector('a[href^="/team/"]')?.getAttribute('href')?.match(/^\/team\/\d+\/[^/]+\/(\d+)\//)?.[1] ??
		null;
	const header = root.querySelector('h2.pure-menu-heading')?.text.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
	const updateLabel = selected?.text.trim() || header?.replace(/^FC\s?\d+\s*/i, '') || null;

	return { teams, layout, offset, hasNext: next !== null, updateId, updateLabel };
}
