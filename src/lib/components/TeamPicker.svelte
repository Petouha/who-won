<script lang="ts">
	interface T { id: number; name: string; league: string; overall: number }
	let { teams, favorites = [], value = $bindable(null), name, label }: {
		teams: T[]; favorites?: number[]; value: number | null; name: string; label: string;
	} = $props();

	let query = $state('');
	let open = $state(false);

	const byId = $derived(new Map(teams.map((t) => [t.id, t])));
	const selected = $derived(value === null ? null : (byId.get(value) ?? null));
	const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	const results = $derived.by(() => {
		const q = norm(query.trim());
		if (!q) return [];
		return teams.filter((t) => norm(t.name).includes(q)).slice(0, 8);
	});
	const favTeams = $derived(favorites.map((id) => byId.get(id)).filter((t): t is T => !!t));

	function pick(t: T) {
		value = t.id;
		query = '';
		open = false;
	}
</script>

<div class="picker">
	<span class="lbl">{label}</span>
	<input type="hidden" {name} value={value ?? ''} />
	{#if selected}
		<div class="chosen">
			<div><strong>{selected.name}</strong><div class="muted">{selected.league}</div></div>
			<span class="ovr num" title="Note globale">{selected.overall}</span>
			<button type="button" class="btn small" onclick={() => (value = null)}>Changer</button>
		</div>
	{:else}
		<input
			type="text" placeholder="Chercher une équipe…" autocomplete="off" bind:value={query}
			onfocus={() => (open = true)} onblur={() => setTimeout(() => (open = false), 120)}
			aria-label="{label} : chercher une équipe"
		/>
		{#if open && results.length}
			<ul class="list">
				{#each results as t (t.id)}
					<li><button type="button" onmousedown={(e) => e.preventDefault()} onclick={() => pick(t)}>
						<span>{t.name} <span class="muted">· {t.league}</span></span><span class="num">{t.overall}</span>
					</button></li>
				{/each}
			</ul>
		{:else if !query && favTeams.length}
			<div class="favs">
				{#each favTeams as t (t.id)}<button type="button" class="chip" onclick={() => pick(t)}>{t.name}</button>{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.picker { position: relative; display: grid; gap: .4rem; }
	.lbl { font-size: .85rem; color: var(--muted); }
	.chosen { display: grid; grid-template-columns: 1fr auto auto; gap: .75rem; align-items: center; padding: .6rem .75rem; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
	.ovr { font-size: 1.4rem; font-weight: 800; }
	.list { position: absolute; top: 100%; left: 0; right: 0; z-index: 10; margin: 4px 0 0; padding: 4px; list-style: none; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 8px 24px rgb(0 0 0 / .15); }
	.list button { width: 100%; display: flex; justify-content: space-between; gap: 1rem; padding: .7rem .6rem; border: 0; background: none; text-align: left; border-radius: 6px; cursor: pointer; }
	.list button:hover, .list button:focus-visible { background: var(--bg); }
	.favs { display: flex; flex-wrap: wrap; gap: .4rem; }
	.chip { padding: .4rem .7rem; border: 1px solid var(--line); background: var(--surface); border-radius: 999px; cursor: pointer; min-height: 36px; }
</style>
