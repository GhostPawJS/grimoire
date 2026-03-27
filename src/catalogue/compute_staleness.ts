const MS_PER_DAY = 86_400_000;

export function computeStaleness(
	lastSealTs: number,
	lastReadTs: number | null,
	now: number,
	staleDays: number,
	dormantDays: number,
): { isStale: boolean; isDormant: boolean; staleness: number } {
	const daysSinceLastSeal = (now - lastSealTs) / MS_PER_DAY;
	const staleness = Math.min(1, daysSinceLastSeal / staleDays);

	const isDormant = lastReadTs === null || (now - lastReadTs) / MS_PER_DAY >= dormantDays;

	const isStale =
		daysSinceLastSeal >= staleDays &&
		lastReadTs !== null &&
		(now - lastReadTs) / MS_PER_DAY < dormantDays;

	return { isStale, isDormant, staleness };
}
