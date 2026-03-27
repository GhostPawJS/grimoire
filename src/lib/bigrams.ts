export function bigrams(text: string): string[] {
	const words = text.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (words.length < 2) return [];
	const result: string[] = [];
	for (let i = 0; i < words.length - 1; i++) {
		result.push(`${words[i]} ${words[i + 1]}`);
	}
	return result;
}

export function topBigrams(texts: string[], limit = 5): string[] {
	const counts = new Map<string, number>();
	for (const text of texts) {
		for (const bg of bigrams(text)) {
			counts.set(bg, (counts.get(bg) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([bg]) => bg);
}
