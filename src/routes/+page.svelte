<script lang="ts">
	import FormDots from '#lib/components/FormDots.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<svelte:head><title>Who Won</title></svelte:head>

<h1>Qui a gagné ?</h1>

<div class="stack">
	<a class="btn primary cta" href="/match/new">Enregistrer un match</a>

	<section class="card">
		<h2>Podium</h2>
		{#if data.standings.length === 0}
			<p class="muted">Pas encore de match. {#if data.totalPlayers < 2}<a href="/players">Ajoute des joueurs</a> puis{/if} lance le premier !</p>
		{:else}
			<ol class="podium">
				{#each data.standings as s, i (s.playerId)}
					<li>
						<span class="rank num">{i + 1}</span>
						<a href="/history?p={s.playerId}"><strong>{s.name}</strong></a>
						<FormDots form={s.form} />
						<span class="num elo">{s.winRate.toFixed(0)} %</span>
					</li>
				{/each}
			</ol>
			<a href="/leaderboard">Classement complet →</a>
		{/if}
	</section>

	<section class="card">
		<h2>Derniers matchs</h2>
		{#if data.recent.length === 0}
			<p class="muted">Rien pour l’instant.</p>
		{:else}
			<ul class="recent">
				{#each data.recent as m (m.id)}
					<li>
						<span class:win={m.winner === 'home'}>{m.homePlayer}</span>
						<strong class="num">{m.homeGoals}–{m.awayGoals}</strong>
						<span class:win={m.winner === 'away'} class="r">{m.awayPlayer}</span>
					</li>
				{/each}
			</ul>
			<a href="/history">Tout l’historique →</a>
		{/if}
	</section>

	<div class="tools">
		<a class="card" href="/h2h"><strong>Face-à-face</strong><span class="muted">Le bilan entre deux joueurs</span></a>
		<a class="card" href="/randomizer"><strong>Équipes aléatoires</strong><span class="muted">Un duel équilibré, tiré au sort</span></a>
	</div>
</div>

<style>
	.cta { min-height: 56px; font-size: 1.1rem; }
	.podium, .recent { list-style: none; padding: 0; margin: 0 0 .75rem; display: grid; gap: .5rem; }
	.podium li { display: grid; grid-template-columns: 1.5rem 1fr auto 3.5rem; gap: .75rem; align-items: center; }
	.rank { color: var(--muted); font-weight: 700; }
	.elo { text-align: right; font-weight: 700; }
	.recent li { display: grid; grid-template-columns: 1fr auto 1fr; gap: .75rem; }
	.recent .r { text-align: right; }
	.win { color: var(--win); font-weight: 600; }
	.tools { display: grid; gap: 1.25rem; }
	.tools a { text-decoration: none; display: grid; gap: .2rem; }
	@media (min-width: 760px) { .tools { grid-template-columns: 1fr 1fr; } }
</style>
