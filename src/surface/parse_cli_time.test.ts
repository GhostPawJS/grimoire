import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCliTime } from './parse_cli_time.ts';

test('now accepts milliseconds, ISO date-time, and calendar dates', () => {
	const expected = Date.UTC(2026, 9, 28);
	for (const input of [String(expected), '2026-10-28T00:00:00Z', '2026-10-28'])
		assert.equal(parseCliTime(input), expected);
	for (const input of ['', 'yesterday', '2026-99-99', 'Infinity'])
		assert.throws(() => parseCliTime(input), /Expected epoch/);
});
