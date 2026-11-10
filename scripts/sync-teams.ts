// Construit data/team_ratings.csv à partir de pages sofifa enregistrées depuis un navigateur.
//
//   npm run sync:teams                     # lit data/sofifa-pages/*.html, écrit le CSV
//   npm run sync:teams -- --dry            # n'écrit rien, affiche seulement le bilan
//   npm run sync:teams -- <dossier>        # autre dossier de pages
//   npm run sync:teams -- --force          # écrit même s'il manque beaucoup d'équipes
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_SIZE, parseTeamsPage, type ParsedTeamsPage } from '../src/lib/sofifa/parse-teams.ts';
import { parseTeamsCsv, stringifyTeamsCsv, type TeamRow } from '../src/lib/sofifa/teams-csv.ts';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const force = args.includes('--force');
const dir = args.find((a) => !a.startsWith('--')) ?? 'data/sofifa-pages';
const CSV = 'data/team_ratings.csv';
const META = 'data/team_ratings.meta.json';

const fail = (msg: string): never => {
	console.error(`\n✗ ${msg}`);
	process.exit(1);
};

// 1. Lire les pages
if (!existsSync(dir)) fail(`Dossier introuvable : ${dir}`);
const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.html')).sort();
if (!files.length) fail(`Aucun fichier .html dans ${dir}`);

const pages: (ParsedTeamsPage & { file: string })[] = files.map((file) => {
	try {
		return { file, ...parseTeamsPage(readFileSync(join(dir, file), 'utf-8')) };
	} catch (e) {
		return fail(`${file} : ${(e as Error).message}`);
	}
});
console.log(`${pages.length} page(s) lue(s) :`);
for (const p of pages) console.log(`  offset ${String(p.offset).padStart(4)} · ${String(p.teams.length).padStart(2)} équipes · mise à jour ${p.updateLabel ?? '?'} · ${p.file}`);

// 2. Une seule mise à jour du jeu, sinon on mélangerait des notes de dates différentes
const updates = new Set(pages.map((p) => p.updateId));
if (updates.size !== 1 || updates.has(null)) {
	fail(`Les pages ne viennent pas toutes de la même mise à jour (${[...updates].join(', ')}). Réenregistre-les depuis une seule version.`);
}
const updateId = pages[0].updateId!;
const updateLabel = pages[0].updateLabel;

// 3. Pages manquantes ?
const offsets = new Set(pages.map((p) => p.offset));
const lastOffset = Math.max(...offsets);
const missing: number[] = [];
for (let o = 0; o <= lastOffset; o += PAGE_SIZE) if (!offsets.has(o)) missing.push(o);
const hasLast = pages.some((p) => !p.hasNext);
if (missing.length) console.warn(`\n⚠ Pages manquantes (offset) : ${missing.join(', ')}`);
if (!hasLast) console.warn(`⚠ Aucune page finale (sans bouton « Suivant ») : il manque au moins la page offset=${lastOffset + PAGE_SIZE}.`);

// 4. Fusion par id sofifa
const byId = new Map<number, TeamRow>();
for (const p of pages) {
	for (const t of p.teams) {
		const prev = byId.get(t.sourceId);
		if (prev && JSON.stringify(prev) !== JSON.stringify(t)) console.warn(`⚠ « ${t.name} » apparaît deux fois avec des valeurs différentes, la première est gardée.`);
		if (!prev) byId.set(t.sourceId, t);
	}
}
const teams = [...byId.values()].sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));

// 5. Comparaison avec le CSV actuel
const old = existsSync(CSV) ? new Map(parseTeamsCsv(readFileSync(CSV, 'utf-8')).map((t) => [t.sourceId, t])) : new Map<number, TeamRow>();
const added = teams.filter((t) => !old.has(t.sourceId));
const removed = [...old.values()].filter((t) => !byId.has(t.sourceId));
const changed = teams.filter((t) => {
	const o = old.get(t.sourceId);
	return o && (o.overall !== t.overall || o.attack !== t.attack || o.midfield !== t.midfield || o.defence !== t.defence);
});
console.log(`\n${teams.length} équipes · mise à jour ${updateLabel ?? updateId}`);
console.log(`  ${added.length} nouvelles · ${changed.length} notes modifiées · ${removed.length} absentes de ces pages (gardées en base)`);
for (const t of changed.slice(0, 5)) {
	const o = old.get(t.sourceId)!;
	console.log(`    ${t.name}: ${o.overall}/${o.attack}/${o.midfield}/${o.defence} → ${t.overall}/${t.attack}/${t.midfield}/${t.defence}`);
}

// 6. Garde-fou : ne pas écraser un fichier complet avec un fichier partiel
if (old.size && teams.length < old.size * 0.9 && !force) {
	console.error(`\n✗ Il n'y a que ${teams.length} équipes pour ${old.size} dans le CSV actuel : il manque sûrement des pages. Rien n'a été écrit (--force pour passer outre).`);
	process.exit(1);
}

if (dry) {
	console.log('\n(--dry : rien n\'a été écrit)');
} else {
	writeFileSync(CSV, stringifyTeamsCsv(teams));
	writeFileSync(META, JSON.stringify({ updateId, updateLabel, syncedAt: new Date().toISOString(), teams: teams.length }, null, '\t') + '\n');
	console.log(`\n✓ ${CSV} et ${META} écrits.`);
}
