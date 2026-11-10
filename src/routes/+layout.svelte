<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const links = [
		{ href: '/', label: 'Accueil' },
		{ href: '/leaderboard', label: 'Classement' },
		{ href: '/match/new', label: 'Match', primary: true },
		{ href: '/history', label: 'Historique' },
		{ href: '/players', label: 'Joueurs' },
		{ href: '/h2h', label: 'Face-à-face', desktopOnly: true },
		{ href: '/randomizer', label: 'Aléatoire', desktopOnly: true }
	];
	const active = (href: string) => (href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href));
</script>

<svelte:head><title>Who Won</title></svelte:head>

{#if data.authed}
	<header class="top">
		<a class="brand" href="/">Who Won</a>
		<nav aria-label="Principal" class="desktop">
			{#each links as l}
				<a href={l.href} class:on={active(l.href)} class:primary={l.primary} aria-current={active(l.href) ? 'page' : undefined}>{l.label}</a>
			{/each}
		</nav>
		<form method="POST" action="/logout" class="who">
			{#if data.me}<span class="muted">{data.me.name}</span>{/if}
			<button class="btn small" type="submit">Quitter</button>
		</form>
	</header>
{/if}

<main class:padded={data.authed}>{@render children()}</main>

{#if data.authed}
	<nav aria-label="Principal" class="bottom">
		{#each links.filter((l) => !l.desktopOnly) as l}
			<a href={l.href} class:on={active(l.href)} class:primary={l.primary} aria-current={active(l.href) ? 'page' : undefined}>{l.label}</a>
		{/each}
	</nav>
{/if}

<style>
	.top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .6rem 1rem; border-bottom: 1px solid var(--line); background: var(--surface); position: sticky; top: 0; z-index: 5; }
	.brand { font-weight: 800; text-decoration: none; letter-spacing: -0.03em; font-size: 1.15rem; }
	.desktop { display: none; gap: .25rem; }
	.desktop a { padding: .4rem .75rem; border-radius: 8px; text-decoration: none; color: var(--muted); }
	.desktop a.on { color: var(--ink); background: var(--bg); }
	.desktop a.primary { background: var(--accent); color: var(--accent-ink); font-weight: 600; }
	.who { display: flex; align-items: center; gap: .6rem; }
	main { max-width: 960px; margin: 0 auto; }
	main.padded { padding: 1.25rem 1rem 6rem; }
	.bottom { position: fixed; inset: auto 0 0 0; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; background: var(--surface); border-top: 1px solid var(--line); padding-bottom: env(safe-area-inset-bottom); z-index: 5; }
	.bottom a { text-align: center; padding: .85rem .25rem; text-decoration: none; font-size: .8rem; color: var(--muted); }
	.bottom a.on { color: var(--ink); font-weight: 600; }
	.bottom a.primary { color: var(--accent); font-weight: 700; }
	@media (min-width: 760px) {
		.desktop { display: flex; }
		.bottom { display: none; }
		main.padded { padding-bottom: 3rem; }
	}
</style>
