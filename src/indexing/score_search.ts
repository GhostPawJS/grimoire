import { readFileSync } from 'node:fs';
import { resolveInsideRoot } from '../lib/safe_path.ts';
import { trigramJaccard } from '../lib/trigram_jaccard.ts';
import type { IndexEntry } from './types.ts';

export function scoreSearch(
	root: string,
	entries: IndexEntry[],
	query: string,
): (IndexEntry & { score: number })[] {
	const stop = new Set([
		'a',
		'an',
		'the',
		'to',
		'of',
		'on',
		'in',
		'is',
		'do',
		'how',
		'i',
		'and',
		'up',
		'set',
		'for',
		'with',
	]);
	const tokenize = (text: string) =>
		text
			.toLowerCase()
			.split(/[^a-z0-9]+/)
			.filter((t) => t.length >= 2 && !stop.has(t))
			.map((t) => (t.length > 4 ? t.replace(/(?:ing|ed|es|s)$/, '') : t));
	const terms = [...new Set(tokenize(query))];
	const documents = entries.map((entry) => {
		let body = '';
		try {
			body = readFileSync(resolveInsideRoot(root, entry.path, 'SKILL.md'), 'utf8')
				.split(/\n---/)
				.slice(1)
				.join('\n');
		} catch {
			/* An unreadable body still permits metadata search. */
		}
		return { entry, fields: [tokenize(entry.name), tokenize(entry.description), tokenize(body)] };
	});
	const frequency = terms.map(
		(term) => documents.filter((d) => d.fields.some((f) => f.some((t) => t.includes(term)))).length,
	);
	return documents
		.map(({ entry, fields }) => {
			let score = 0;
			terms.forEach((term, index) => {
				const idf = Math.log(1 + (entries.length + 1) / ((frequency[index] ?? 0) + 1));
				fields.forEach((field, i) => {
					const count = field.filter((t) => t.includes(term)).length;
					score += ((3 - i) * idf * count) / (count + 1);
				});
			});
			const fuzzy = Math.max(
				trigramJaccard(query.toLowerCase(), entry.name.toLowerCase()),
				trigramJaccard(query.toLowerCase(), entry.description.toLowerCase()),
			);
			const substring =
				entry.name.toLowerCase().includes(query.toLowerCase()) ||
				entry.description.toLowerCase().includes(query.toLowerCase());
			return { ...entry, score: score + (fuzzy >= 0.3 ? fuzzy : 0) + (substring ? 1 : 0) };
		})
		.filter((e) => e.score > 0)
		.sort((a, b) => b.score - a.score || b.rank - a.rank || a.path.localeCompare(b.path));
}
