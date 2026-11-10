export interface TeamRow {
	sourceId: number;
	name: string;
	league: string;
	overall: number;
	attack: number;
	midfield: number;
	defence: number;
}

/** Colonnes attendues : id,name,league,overall,attack,midfield,defence (sans guillemets). */
export function parseTeamsCsv(csv: string): TeamRow[] {
	const [header, ...lines] = csv.split(/\r?\n/).filter((l) => l.trim());
	const cols = header.split(',');
	const idx = (c: string) => {
		const i = cols.indexOf(c);
		if (i < 0) throw new Error(`Colonne manquante dans le CSV: ${c}`);
		return i;
	};
	const [iId, iName, iLeague, iOv, iAt, iMid, iDef] = [
		'id', 'name', 'league', 'overall', 'attack', 'midfield', 'defence'
	].map(idx);
	return lines.map((line) => {
		const f = line.split(',');
		return {
			sourceId: Number(f[iId]),
			name: f[iName].trim(),
			league: f[iLeague].trim(),
			overall: Number(f[iOv]),
			attack: Number(f[iAt]),
			midfield: Number(f[iMid]),
			defence: Number(f[iDef])
		};
	});
}
