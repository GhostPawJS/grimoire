import { tier } from './tier.ts';
import type { TierInfo } from './types.ts';

export function tierInfo(rank: number): TierInfo {
	const t = tier(rank);
	let sealsToNextTier: number;

	switch (t) {
		case 'Uncheckpointed':
			sealsToNextTier = 1 - rank;
			break;
		case 'Apprentice':
			sealsToNextTier = 3 - rank;
			break;
		case 'Journeyman':
			sealsToNextTier = 6 - rank;
			break;
		case 'Expert':
			sealsToNextTier = 10 - rank;
			break;
		case 'Master':
			sealsToNextTier = 0;
			break;
	}

	return { tier: t, rank, sealsToNextTier };
}
