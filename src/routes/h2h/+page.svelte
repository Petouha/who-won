<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	const go = (a: number | null, b: number | null) => goto(a && b ? `?a=${a}&b=${b}` : '?');
	const name = (id: number | null) => data.players.find((p) => p.id === id)?.name ?? '';
	const total = $derived(data.h2h?.played || 1);
</script>

<svelte:head><title>Face-à-face · Who Won</title></svelte:head>

<h1>Face-à-face</h1>

<div class="stack">
	<div class="pick">
		<select value={data.a ?? ''} onchange={(e) => go(Number(e.currentTarget.value) || null, data.b)} aria-label="Premier joueur">
			<option value="">Joueur 1</option>
			{#each data.players as p}<option value={p.id} disabled={p.id === data.b}>{p.name}</option>{/each}
		</select>
		<span class="muted">vs</span>
		<select value={data.b ?? ''} onchange={(e) => go(data.a, Number(e.currentTarget.value) || null)} aria-label="Second joueur">
			<option value="">Joueur 2</option>
			{#each data.players as p}<option value={p.id} disabled={p.id === data.a}>{p.name}</option>{/each}
		</select>
	</div>

	{#if data.h2h && data.h2h.played === 0}
		<p class="card muted">{name(data.a)} et {name(data.b)} ne se sont jamais affrontés.</p>
	{:else if data.h2h}
		{@const h = data.h2h}
		<section class="card stack">
			<div class="big num">
				<span class="W">{h.aWins}</span><span class="muted">–</span><span class="D">{h.draws}</span><span class="muted">–</span><span class="L">{h.bWins}</span>
			</div>
			<div class="bar" role="img" aria-label="{h.aWins} victoires {name(data.a)}, {h.draws} nuls, {h.bWins} victoires {name(data.b)}">
				<span style="flex:{h.aWins}" class="a"></span><span style="flex:{h.draws}" class="d"></span><span style="flex:{h.bWins}" class="b"></span>
			</div>
			<p class="muted">{name(data.a)} · {h.played} matchs · {name(data.b)} — buts {h.aGoals}–{h.bGoals} ({(h.aGoals / total).toFixed(1)} / {(h.bGoals / total).toFixed(1)} par match)</p>
		</section>

		<section class="card">
			<h2>Derniers duels</h2>
			<ul class="list">
				{#each data.matches as m (m.id)}
					<li><span class:win={m.winner === 'home'}>{m.homePlayer}</span><strong class="num">{m.homeGoals}–{m.awayGoals}</strong><span class:win={m.winner === 'away'} class="r">{m.awayPlayer}</span></li>
				{/each}
			</ul>
		</section>
	{:else}
		<p class="muted">Choisis deux joueurs.</p>
	{/if}
</div>

<style>
	.pick { display: grid; grid-template-columns: 1fr auto 1fr; gap: .75rem; align-items: center; }
	.big { display: flex; justify-content: center; gap: 1rem; font-size: 3rem; font-weight: 800; }
	.bar { display: flex; height: 10px; border-radius: 99px; overflow: hidden; background: var(--line); }
	.bar .a { background: var(--win); } .bar .d { background: var(--draw); } .bar .b { background: var(--loss); }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
	.list li { display: grid; grid-template-columns: 1fr auto 1fr; gap: .75rem; }
	.r { text-align: right; } .win { color: var(--win); font-weight: 600; }
</style>
