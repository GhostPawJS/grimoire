export function trigrams(text: string): Set<string> {
	const normalized = text.toLowerCase().trim();
	if (normalized.length < 3) {
		return new Set(normalized.length > 0 ? [normalized] : []);
	}
	const result = new Set<string>();
	for (let i = 0; i <= normalized.length - 3; i++) {
		result.add(normalized.slice(i, i + 3));
	}
	return result;
}

export function trigramJaccard(a: string, b: string): number {
	const setA = trigrams(a);
	const setB = trigrams(b);
	if (setA.size === 0 && setB.size === 0) return 1;
	if (setA.size === 0 || setB.size === 0) return 0;
	let intersection = 0;
	for (const tri of setA) {
		if (setB.has(tri)) intersection++;
	}
	return intersection / (setA.size + setB.size - intersection);
}
