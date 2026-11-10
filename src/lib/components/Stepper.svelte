<script lang="ts">
	let { value = $bindable(0), name, label, max = 99 }: { value: number; name: string; label: string; max?: number } = $props();
</script>

<div class="stepper" role="group" aria-label={label}>
	<button type="button" class="btn" aria-label="Moins" onclick={() => (value = Math.max(0, value - 1))} disabled={value <= 0}>−</button>
	<input {name} type="number" inputmode="numeric" min="0" {max} bind:value aria-label={label} />
	<button type="button" class="btn" aria-label="Plus" onclick={() => (value = Math.min(max, value + 1))} disabled={value >= max}>+</button>
</div>

<style>
	.stepper { display: grid; grid-template-columns: 52px 1fr 52px; gap: .4rem; }
	.btn { font-size: 1.4rem; min-height: 52px; }
	input { text-align: center; font-size: 1.8rem; font-weight: 700; min-height: 52px; padding: 0; appearance: textfield; -moz-appearance: textfield; font-variant-numeric: tabular-nums; }
	input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
</style>
