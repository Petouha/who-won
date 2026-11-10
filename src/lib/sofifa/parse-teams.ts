import { parse } from 'node-html-parser';
import type { TeamRow } from './teams-csv.ts';

/** Nombre d'équipes par page de la liste sofifa. */
export const PAGE_SIZE = 75;

export interface ParsedTeamsPage {
	teams: TeamRow[];
	/** Offset de cette page dans la liste (0, 75, 150…), déduit des liens de pagination. */
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

/** Lit une page « sofifa.com/teams » enregistrée depuis un navigateur (interface en français ou en anglais). */
export function parseTeamsPage(html: string): ParsedTeamsPage {
	const root = parse(html);

	const title = root.querySelector('title')?.text ?? '';
	if (/just a moment|un instant|checking your browser/i.test(title)) {
		throw new Error('C’est la page de vérification Cloudflare, pas la liste des équipes.');
	}

	const rows = root.querySelectorAll('table tbody tr');
	const teams: TeamRow[] = [];
	for (const row of rows) {
		const link = row.querySelector('td.s20 a[href^="/team/"]');
		if (!link) continue;
		const name = link.text.trim();
		const sourceId = Number(link.getAttribute('href')?.match(/^\/team\/(\d+)/)?.[1]);
		const league = row.querySelector('td.s20 a.sub')?.text.trim() ?? '';
		const rating = (col: string) => Number(row.querySelector(`td[data-col="${col}"] em`)?.text.trim());
		const t = { sourceId, name, league, overall: rating('oa'), attack: rating('at'), midfield: rating('md'), defence: rating('df') };

		const bad = Object.entries(t).find(([k, v]) => (k === 'name' || k === 'league' ? !v : !Number.isInteger(v)));
		if (bad) throw new Error(`Ligne illisible pour « ${name || '?'} » (champ ${bad[0]}). Le format de sofifa a peut-être changé.`);
		teams.push(t);
	}
	if (teams.length === 0) throw new Error('Aucune équipe trouvée dans cette page.');

	// Pagination : « Suivant/Next » et « Précédent/Previous » sont des liens ?offset=N.
	let next: number | null = null;
	let prev: number | null = null;
	for (const a of root.querySelectorAll('.pagination a')) {
		const text = a.text.trim().toLowerCase();
		const off = offsetOf(a.getAttribute('href'));
		if (off === null) continue;
		if (/suivant|next/.test(text)) next = off;
		else if (/pr[ée]c[ée]dent|previous|prev/.test(text)) prev = off;
	}
	const offset = next !== null ? next - teams.length : prev !== null ? prev + PAGE_SIZE : 0;

	// Mise à jour affichée : l'option sélectionnée de la liste « roster ».
	const selected = root.querySelector('select[name="roster"] option[selected]');
	const updateId = selected?.getAttribute('value')?.match(/[?&]r=(\d+)/)?.[1] ?? null;
	const updateLabel = selected?.text.trim() || null;

	return { teams, offset, hasNext: next !== null, updateId, updateLabel };
}
