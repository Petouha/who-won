<script lang="ts">
	import { pickMatchup } from '#lib/randomizer.ts';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	let min = $state(75);
	let max = $state(85);
	let maxDiff = $state(1);
	let league = $state('');
	let result = $state<ReturnType<typeof pickMatchup<(typeof data.teams)[number]>> | undefined>();

	const leagues = $derived([...new Set(data.teams.map((t) => t.league))].sort((a, b) => a.localeCompare(b)));
	const roll = () => (result = pickMatchup(data.teams, { min, max, maxDiff, leagues: league ? [league] : [] }));
</script>

<svelte:head><title>Équipes aléatoires · Who Won</title></svelte:head>

<h1>Équipes aléatoires</h1>

<div class="stack">
	<form class="card grid" onsubmit={(e) => { e.preventDefault(); roll(); }}>
		<label class="field">Note min<input type="number" inputmode="numeric" min="40" max="95" bind:value={min} /></label>
		<label class="field">Note max<input type="number" inputmode="numeric" min="40" max="95" bind:value={max} /></label>
		<label class="field">Écart max<input type="number" inputmode="numeric" min="0" max="20" bind:value={maxDiff} /></label>
		<label class="field">Ligue
			<select bind:value={league}>
				<option value="">Toutes</option>
				{#each leagues as l}<option>{l}</option>{/each}
			</select>
		</label>
		<button class="btn primary full" type="submit">Tirer au sort</button>
	</form>

	{#if result === null}
		<p class="card error">Aucun duel possible avec ces critères. Élargis la note ou l’écart.</p>
	{:else if result}
		<section class="card duel" aria-live="polite">
			{#each result as t}
				<div class="team"><strong>{t.name}</strong><span class="muted">{t.league}</span><span class="ovr num">{t.overall}</span></div>
			{/each}
			<div class="actions">
				<button class="btn" onclick={roll}>Relancer</button>
				<a class="btn primary" href="/match/new?ht={result[0].id}&at={result[1].id}">Jouer ce match</a>
			</div>
		</section>
	{/if}
</div>

<style>
	.grid { display: grid; gap: .9rem; grid-template-columns: 1fr 1fr; }
	.grid .full { grid-column: 1 / -1; }
	.duel { display: grid; gap: 1rem; }
	.team { display: grid; gap: .1rem; text-align: center; }
	.team strong { font-size: 1.3rem; }
	.ovr { font-size: 2.2rem; font-weight: 800; }
	.actions { display: flex; gap: .6rem; justify-content: center; flex-wrap: wrap; }
	@media (min-width: 760px) { .grid { grid-template-columns: repeat(4, 1fr); } .duel { grid-template-columns: 1fr 1fr; } .actions { grid-column: 1 / -1; } }
</style>
