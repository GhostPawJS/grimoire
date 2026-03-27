import type { Tier } from './types.ts';

export function tier(rank: number): Tier {
	if (rank <= 0) return 'Uncheckpointed';
	if (rank <= 2) return 'Apprentice';
	if (rank <= 5) return 'Journeyman';
	if (rank <= 9) return 'Expert';
	return 'Master';
}
