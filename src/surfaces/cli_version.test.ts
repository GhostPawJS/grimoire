import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cliVersion } from './cli_version.ts';

test('human version identifies binary, npm and library execution', () => {
	assert.equal(
		cliVersion('1.2.3', { sea: () => true, platform: 'linux', arch: 'x64', npm: true }),
		'tool 1.2.3 (binary, linux-x64)',
	);
	assert.equal(
		cliVersion('1.2.3', { sea: () => true, platform: 'win32', arch: 'x64' }),
		'tool 1.2.3 (binary, windows-x64)',
	);
	assert.equal(cliVersion('1.2.3', { sea: () => false, npm: true }), 'tool 1.2.3 (npm)');
	assert.equal(cliVersion('1.2.3', { sea: () => false, npm: false }), 'tool 1.2.3 (library)');
	assert.equal(
		cliVersion('1.2.3', {
			sea: () => {
				throw new Error('unavailable');
			},
			npm: false,
		}),
		'tool 1.2.3 (library)',
	);
});

test('npm entry marker selects npm version output', async () => {
	const { markNpmEntry } = await import('./mark_npm_entry.ts');
	const { npmEntry } = await import('./npm_entry.ts');
	try {
		markNpmEntry();
		assert.equal(cliVersion('1', { sea: () => false }), 'tool 1 (npm)');
	} finally {
		npmEntry.active = false;
	}
});

test('--version --short prints bare semver and --json the full record', async () => {
	const { cliVersionOutput } = await import('./cli_version.ts');
	const opts = { bin: 'ghostpaw-grimoire', sea: () => true, platform: 'darwin', arch: 'arm64' };
	assert.equal(cliVersionOutput('1.2.3', ['--version', '--short'], opts), '1.2.3\n');
	assert.deepEqual(JSON.parse(cliVersionOutput('1.2.3', ['--version', '--json'], opts)), {
		name: 'ghostpaw-grimoire',
		version: '1.2.3',
		variant: 'binary',
		target: 'darwin-arm64',
	});
	assert.equal(
		cliVersionOutput('1.2.3', ['--version'], opts),
		'ghostpaw-grimoire 1.2.3 (binary, darwin-arm64)\n',
	);
	assert.equal(
		JSON.parse(cliVersionOutput('1.2.3', ['--json', '-v'], { sea: () => false, npm: true }))
			.variant,
		'npm',
	);
});
