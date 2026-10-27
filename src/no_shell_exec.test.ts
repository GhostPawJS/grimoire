import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

test('source child processes use argument arrays without a shell', () => {
	const files = readdirSync(new URL('.', import.meta.url), { recursive: true, encoding: 'utf8' });
	for (const file of files) {
		if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue;
		const content = readFileSync(join(import.meta.dirname, file), 'utf8');
		assert.doesNotMatch(
			content,
			/\bexecSync\s*\(|shell\s*:\s*true|import\s*\{[^}]*\bexec\b[^}]*\}\s*from\s*['"]node:child_process['"]/,
			file,
		);
	}
});
