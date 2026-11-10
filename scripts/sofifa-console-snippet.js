// @ts-nocheck : script de console navigateur, hors du projet TypeScript
// À coller dans la console du navigateur (F12 > Console) sur
// https://sofifa.com/teams?col=oa&sort=desc&r=260046&set=true
// Suit les boutons « Suivant » (pause de 1,5 s entre chaque page) puis télécharge
// UN fichier « sofifa-teams.json » à placer dans data/sofifa-pages/.
(async () => {
	const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
	const pages = [];
	let url = location.href;
	while (url && pages.length < 40) {
		const res = await fetch(url, { credentials: 'same-origin' });
		const html = await res.text();
		if (!res.ok || /<title>[^<]*(just a moment|un instant)/i.test(html)) {
			console.error(`Bloqué à la page ${pages.length + 1} (HTTP ${res.status}). Recharge la page sofifa, valide la vérification, puis relance.`);
			return;
		}
		pages.push({ url, html });
		console.log(`page ${pages.length} ok`);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const next = [...doc.querySelectorAll('.pagination a')].find((a) => /suivant|next/i.test(a.textContent));
		url = next ? new URL(next.getAttribute('href'), location.origin).href : null;
		if (url) await sleep(1500);
	}
	const blob = new Blob([JSON.stringify({ pages })], { type: 'application/json' });
	const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'sofifa-teams.json' });
	a.click();
	console.log(`Terminé : ${pages.length} pages, fichier téléchargé.`);
})();
