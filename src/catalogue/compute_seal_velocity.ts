const MS_PER_DAY = 86_400_000;
const WINDOW_DAYS = 30;

export function computeSealVelocity(sealTimestamps: number[], now: number): number {
	const recentCutoff = now - WINDOW_DAYS * MS_PER_DAY;
	const previousCutoff = recentCutoff - WINDOW_DAYS * MS_PER_DAY;

	let recentSeals = 0;
	let previousSeals = 0;

	for (const ts of sealTimestamps) {
		if (ts >= recentCutoff) {
			recentSeals++;
		} else if (ts >= previousCutoff) {
			previousSeals++;
		}
	}

	return recentSeals - previousSeals;
}
