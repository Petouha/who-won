<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
	const groups = $derived.by(() => {
		const out: { label: string; items: typeof data.matches }[] = [];
		for (const m of data.matches) {
			const label = day.format(new Date(m.playedAt * 1000));
			(out.at(-1)?.label === label ? out.at(-1)! : out[out.push({ label, items: [] }) - 1]).items.push(m);
		}
		return out;
	});
</script>

<svelte:head><title>Historique · Who Won</title></svelte:head>

<div class="row head">
	<h1>Historique</h1>
	<select aria-label="Filtrer par joueur" value={data.pid ?? ''} onchange={(e) => goto(e.currentTarget.value ? `?p=${e.currentTarget.value}` : '?')}>
		<option value="">Tous les joueurs</option>
		{#each data.players as p}<option value={p.id}>{p.name}</option>{/each}
	</select>
</div>

{#if groups.length === 0}
	<p class="card muted">Aucun match. <a href="/match/new">Enregistrer le premier</a></p>
{/if}

<div class="stack">
	{#each groups as g}
		<section>
			<h2 class="muted day">{g.label}</h2>
			<ul class="list">
				{#each g.items as m (m.id)}
					<li class="card match">
						<div class="side" class:win={m.winner === 'home'}><strong>{m.homePlayer}</strong><span class="muted">{m.homeTeam}</span></div>
						<div class="score num">
							{m.homeGoals}–{m.awayGoals}
							{#if m.homePens !== null}<small class="muted">({m.homePens}–{m.awayPens} tab)</small>{/if}
						</div>
						<div class="side right" class:win={m.winner === 'away'}><strong>{m.awayPlayer}</strong><span class="muted">{m.awayTeam}</span></div>
						<div class="actions">
							<a class="btn small" href="/match/new?home={m.homePlayerId}&away={m.awayPlayerId}&ht={m.homeTeamId}&at={m.awayTeamId}">Revanche</a>
							<form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm('Supprimer ce match ?')) cancel(); }}>
								<input type="hidden" name="id" value={m.id} />
								<button class="btn small danger" type="submit">Supprimer</button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.head { justify-content: space-between; margin-bottom: 1rem; }
	.head h1 { margin: 0; }
	.head select { width: auto; }
	.day { text-transform: capitalize; font-weight: 600; font-size: .9rem; }
	.list { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; }
	.match { display: grid; grid-template-columns: 1fr auto 1fr; gap: .75rem; align-items: center; }
	.side { display: grid; min-width: 0; }
	.side span, .side strong { overflow: hidden; text-overflow: ellipsis; }
	.side.right { text-align: right; }
	.side.win strong { color: var(--win); }
	.score { font-size: 1.5rem; font-weight: 800; text-align: center; }
	.score small { display: block; font-size: .7rem; font-weight: 400; }
	.actions { grid-column: 1 / -1; display: flex; gap: .5rem; justify-content: flex-end; }
</style>
