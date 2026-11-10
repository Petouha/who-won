<script lang="ts">
	import { enhance } from '$app/forms';
	import Stepper from '#lib/components/Stepper.svelte';
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Valeurs initiales issues de l'URL (revanche, tirage aléatoire) : lire `data` une seule fois est voulu.
	// svelte-ignore state_referenced_locally
	let homePlayer = $state<number | null>(data.prefill.home);
	// svelte-ignore state_referenced_locally
	let awayPlayer = $state<number | null>(data.prefill.away);
	// svelte-ignore state_referenced_locally
	let homeTeam = $state<number | null>(data.prefill.homeTeam);
	// svelte-ignore state_referenced_locally
	let awayTeam = $state<number | null>(data.prefill.awayTeam);
	let homeGoals = $state(0);
	let awayGoals = $state(0);
	let pens = $state(false);
	let homePens = $state(0);
	let awayPens = $state(0);
	let busy = $state(false);

	const draw = $derived(homeGoals === awayGoals);
	const showPens = $derived(pens && draw);
	const ready = $derived(
		homePlayer !== null && awayPlayer !== null && homePlayer !== awayPlayer && homeTeam !== null && awayTeam !== null &&
			(!showPens || homePens !== awayPens)
	);
	const nameOf = (id: number | null) => data.players.find((p) => p.id === id)?.name;
</script>

<svelte:head><title>Nouveau match · Who Won</title></svelte:head>

<h1>Nouveau match</h1>

{#if data.players.length < 2}
	<p class="card">Il faut au moins deux joueurs. <a href="/players">Ajouter des joueurs</a></p>
{:else}
	<form
		method="POST"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
		class="stack"
	>
		<div class="sides">
			{#each [{ k: 'home', title: 'Domicile' }, { k: 'away', title: 'Extérieur' }] as side}
				{@const home = side.k === 'home'}
				<section class="card stack">
					<h2>{side.title}</h2>
					<label class="field">Joueur
						{#if home}
							<select name="homePlayerId" bind:value={homePlayer}>
								<option value={null}>— Choisir —</option>
								{#each data.players as p}<option value={p.id} disabled={p.id === awayPlayer}>{p.name}</option>{/each}
							</select>
						{:else}
							<select name="awayPlayerId" bind:value={awayPlayer}>
								<option value={null}>— Choisir —</option>
								{#each data.players as p}<option value={p.id} disabled={p.id === homePlayer}>{p.name}</option>{/each}
							</select>
						{/if}
					</label>
					{#if home}
						<TeamPicker teams={data.teams} favorites={data.favorites[homePlayer ?? -1] ?? []} bind:value={homeTeam} name="homeTeamId" label="Équipe" />
						<Stepper bind:value={homeGoals} name="homeGoals" label="Buts {nameOf(homePlayer) ?? 'domicile'}" />
					{:else}
						<TeamPicker teams={data.teams} favorites={data.favorites[awayPlayer ?? -1] ?? []} bind:value={awayTeam} name="awayTeamId" label="Équipe" />
						<Stepper bind:value={awayGoals} name="awayGoals" label="Buts {nameOf(awayPlayer) ?? 'extérieur'}" />
					{/if}
				</section>
			{/each}
		</div>

		<section class="card stack">
			<label class="row"><input type="checkbox" name="pens" bind:checked={pens} disabled={!draw} /> Tirs au but {#if !draw}<span class="muted">(seulement si égalité)</span>{/if}</label>
			{#if showPens}
				<div class="sides">
					<Stepper bind:value={homePens} name="homePens" label="Tirs au but {nameOf(homePlayer) ?? 'domicile'}" />
					<Stepper bind:value={awayPens} name="awayPens" label="Tirs au but {nameOf(awayPlayer) ?? 'extérieur'}" />
				</div>
				{#if homePens === awayPens}<p class="muted">Les tirs au but doivent désigner un vainqueur.</p>{/if}
			{/if}
		</section>

		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<button class="btn primary big" type="submit" disabled={!ready || busy}>{busy ? 'Enregistrement…' : 'Enregistrer le match'}</button>
	</form>
{/if}

<style>
	.sides { display: grid; gap: 1.25rem; }
	.big { min-height: 54px; font-size: 1.05rem; }
	@media (min-width: 760px) { .sides { grid-template-columns: 1fr 1fr; } }
</style>
