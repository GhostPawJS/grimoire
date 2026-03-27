import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { computeSealVelocity } from './compute_seal_velocity.ts';

const MS_PER_DAY = 86_400_000;

describe('computeSealVelocity', () => {
	const now = Date.now();

	it('returns 0 with no seals', () => {
		assert.equal(computeSealVelocity([], now), 0);
	});

	it('positive velocity: more recent seals than previous', () => {
		const seals = [
			now - 5 * MS_PER_DAY,
			now - 10 * MS_PER_DAY,
			now - 15 * MS_PER_DAY,
			now - 45 * MS_PER_DAY,
		];
		assert.equal(computeSealVelocity(seals, now), 2);
	});

	it('negative velocity: stagnating', () => {
		const seals = [
			now - 5 * MS_PER_DAY,
			now - 35 * MS_PER_DAY,
			now - 40 * MS_PER_DAY,
			now - 50 * MS_PER_DAY,
		];
		assert.equal(computeSealVelocity(seals, now), -2);
	});

	it('zero velocity when equal windows', () => {
		const seals = [now - 10 * MS_PER_DAY, now - 40 * MS_PER_DAY];
		assert.equal(computeSealVelocity(seals, now), 0);
	});

	it('ignores seals older than 60 days', () => {
		const seals = [now - 5 * MS_PER_DAY, now - 100 * MS_PER_DAY];
		assert.equal(computeSealVelocity(seals, now), 1);
	});
});
