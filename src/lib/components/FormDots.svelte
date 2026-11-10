<script lang="ts">
	import type { Result } from '#lib/stats.ts';
	let { form }: { form: Result[] } = $props();
	const label = { W: 'Victoire', D: 'Nul', L: 'Défaite' };
</script>

<span class="dots" aria-label={form.map((r) => label[r]).join(', ') || 'Aucun match'}>
	{#each form as r}<span class={r} title={label[r]}>{r === 'W' ? 'V' : r === 'D' ? 'N' : 'D'}</span>{/each}
</span>

<style>
	.dots { display: inline-flex; gap: 3px; }
	.dots span { width: 1.3rem; height: 1.3rem; display: inline-grid; place-items: center; font-size: .7rem; font-weight: 700; border-radius: 4px; border: 1px solid currentColor; }
</style>
