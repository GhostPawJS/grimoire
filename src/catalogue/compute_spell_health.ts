export function computeSpellHealth(
	staleness: number,
	oversizeRatio: number,
	resonanceWeight: number,
): number {
	const raw = (1 - staleness) * (1 - oversizeRatio) * resonanceWeight;
	return Math.max(0, Math.min(1, raw));
}
