<script lang="ts">
	import FormDots from '#lib/components/FormDots.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	type Key = 'elo' | 'wins' | 'winRate' | 'goalDiff' | 'played';
	let sort = $state<Key>('elo');
	const rows = $derived([...data.rows].sort((a, b) => b[sort] - a[sort] || b.elo - a.elo));
	const cols: { k: Key; label: string }[] = [
		{ k: 'played', label: 'J' }, { k: 'wins', label: 'V' }, { k: 'winRate', label: '%V' }, { k: 'goalDiff', label: '+/-' }, { k: 'elo', label: 'Elo' }
	];
</script>

<svelte:head><title>Classement · Who Won</title></svelte:head>

<h1>Classement</h1>

{#if data.rows.length === 0}
	<p class="card muted">Aucun joueur. <a href="/players">En ajouter</a></p>
{:else}
	<div class="card scroll-x">
		<table>
			<thead>
				<tr>
					<th>#</th><th class="l">Joueur</th>
					{#each cols as c}
						<th aria-sort={sort === c.k ? 'descending' : 'none'}><button class="th" class:on={sort === c.k} onclick={() => (sort = c.k)}>{c.label}</button></th>
					{/each}
					<th>N</th><th>D</th><th>BP</th><th>BC</th><th class="l">Forme</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r, i (r.playerId)}
					<tr>
						<td class="muted num">{i + 1}</td>
						<td class="l"><a href="/history?p={r.playerId}"><strong>{r.name}</strong></a></td>
						<td class="num">{r.played}</td>
						<td class="num W">{r.wins}</td>
						<td class="num">{r.winRate.toFixed(0)}</td>
						<td class="num" class:W={r.goalDiff > 0} class:L={r.goalDiff < 0}>{r.goalDiff > 0 ? '+' : ''}{r.goalDiff}</td>
						<td class="num"><strong>{r.elo}</strong></td>
						<td class="num D">{r.draws}</td>
						<td class="num L">{r.losses}</td>
						<td class="num">{r.goalsFor}</td>
						<td class="num">{r.goalsAgainst}</td>
						<td class="l"><FormDots form={r.form} /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="muted note">Elo : départ à 1000, K=24, calculé match après match. Une victoire aux tirs au but compte comme une victoire.</p>
{/if}

<style>
	.th { background: none; border: 0; padding: .25rem; cursor: pointer; font: inherit; color: inherit; text-transform: inherit; letter-spacing: inherit; }
	.th.on { color: var(--ink); text-decoration: underline; }
	.note { font-size: .85rem; }
</style>
