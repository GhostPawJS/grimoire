import { GrimoireValidationError } from './errors.ts';

export function resolveNow(now?: number): number {
	if (now !== undefined) {
		if (!Number.isFinite(now) || now < 0) {
			throw new GrimoireValidationError('now must be a finite non-negative number');
		}
		return now;
	}
	return Date.now();
}
