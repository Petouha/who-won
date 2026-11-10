export interface TeamRow {
	/** Id sofifa de l'équipe (stable d'une mise à jour à l'autre). */
	sourceId: number;
	name: string;
	league: string;
	overall: number;
	attack: number;
	midfield: number;
	defence: number;
}

const COLUMNS = ['id', 'name', 'league', 'overall', 'attack', 'midfield', 'defence'] as const;

const quote = (v: string | number) => {
	const s = String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function splitLine(line: string): string[] {
	const out: string[] = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const c = line[i];
		if (inQuotes) {
			if (c === '"' && line[i + 1] === '"') (cur += '"'), i++;
			else if (c === '"') inQuotes = false;
			else cur += c;
		} else if (c === '"') inQuotes = true;
		else if (c === ',') (out.push(cur), (cur = ''));
		else cur += c;
	}
	out.push(cur);
	return out;
}

export function stringifyTeamsCsv(teams: TeamRow[]): string {
	const lines = teams.map((t) => [t.sourceId, t.name, t.league, t.overall, t.attack, t.midfield, t.defence].map(quote).join(','));
	return [COLUMNS.join(','), ...lines].join('\n') + '\n';
}

/** Colonnes attendues : id,name,league,overall,attack,midfield,defence. */
export function parseTeamsCsv(csv: string): TeamRow[] {
	const [header, ...lines] = csv.split(/\r?\n/).filter((l) => l.trim());
	const cols = splitLine(header);
	const idx = (c: string) => {
		const i = cols.indexOf(c);
		if (i < 0) throw new Error(`Colonne manquante dans le CSV: ${c}`);
		return i;
	};
	const [iId, iName, iLeague, iOv, iAt, iMid, iDef] = COLUMNS.map(idx);
	return lines.map((line, n) => {
		const f = splitLine(line);
		const row = {
			sourceId: Number(f[iId]),
			name: f[iName]?.trim(),
			league: f[iLeague]?.trim(),
			overall: Number(f[iOv]),
			attack: Number(f[iAt]),
			midfield: Number(f[iMid]),
			defence: Number(f[iDef])
		};
		const nums = [row.sourceId, row.overall, row.attack, row.midfield, row.defence];
		if (!row.name || !row.league || nums.some((x) => !Number.isInteger(x))) {
			throw new Error(`CSV invalide, ligne ${n + 2} : ${line}`);
		}
		return row;
	});
}
