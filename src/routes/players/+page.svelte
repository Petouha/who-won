<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Joueurs · Who Won</title></svelte:head>

<h1>Joueurs</h1>
<div class="stack">
	<form method="POST" action="?/add" use:enhance class="card stack">
		<label class="field">Nouveau joueur
			<input type="text" name="name" maxlength="40" required autocomplete="off" value={form && 'name' in form ? form.name : ''} />
		</label>
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<button class="btn primary" type="submit">Ajouter</button>
	</form>

	<div class="card">
		{#if data.players.length === 0}
			<p class="muted">Aucun joueur pour l’instant.</p>
		{:else}
			<table>
				<thead><tr><th>Joueur</th><th>Matchs</th><th></th></tr></thead>
				<tbody>
					{#each data.players as p (p.id)}
						<tr>
							<td><a href="/history?p={p.id}">{p.name}</a></td>
							<td class="num">{p.played}</td>
							<td>
								{#if p.played === 0}
									<form method="POST" action="?/remove" use:enhance>
										<input type="hidden" name="id" value={p.id} />
										<button class="btn small danger" type="submit" aria-label="Supprimer {p.name}">Supprimer</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
