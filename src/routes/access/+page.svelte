<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Accès · Who Won</title></svelte:head>

<div class="wrap">
	<form method="POST" use:enhance class="card stack">
		<div>
			<h1>Who Won</h1>
			<p class="muted">Entre le code pour accéder au site.</p>
		</div>
		<label class="field">Code d’accès
			<input type="password" name="code" required autocomplete="current-password" />
		</label>
		{#if data.players.length}
			<label class="field">Qui es-tu ? (optionnel)
				<select name="player">
					<option value="">— Je ne dis pas —</option>
					{#each data.players as p}<option value={p.id}>{p.name}</option>{/each}
				</select>
			</label>
		{/if}
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<button class="btn primary" type="submit">Entrer</button>
	</form>
</div>

<style>
	.wrap { min-height: 100dvh; display: grid; place-items: center; padding: 1rem; }
	form { width: min(100%, 380px); }
</style>
