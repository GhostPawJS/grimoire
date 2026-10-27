import { isSea } from 'node:sea';

import { npmEntry } from './npm_entry.ts';

export { markNpmEntry } from './mark_npm_entry.ts';

export interface CliVersionOptions {
	bin?: string;
	sea?: () => boolean;
	npm?: boolean;
	platform?: string;
	arch?: string;
}

export interface CliVersionInfo {
	name: string;
	version: string;
	variant: 'binary' | 'npm' | 'library';
	target: string;
}

export function cliVersionInfo(
	version: string,
	{
		bin = 'tool',
		sea = isSea,
		npm = npmEntry.active,
		platform = process.platform,
		arch = process.arch,
	}: CliVersionOptions = {},
): CliVersionInfo {
	let binary = false;
	try {
		binary = sea();
	} catch {
		binary = false;
	}
	return {
		name: bin,
		version,
		variant: binary ? 'binary' : npm ? 'npm' : 'library',
		target: `${platform === 'win32' ? 'windows' : platform}-${arch}`,
	};
}

export function cliVersion(version: string, options: CliVersionOptions = {}): string {
	const info = cliVersionInfo(version, options);
	const variant = info.variant === 'binary' ? `binary, ${info.target}` : info.variant;
	return `${info.name} ${info.version} (${variant})`;
}

/** Renders `--version` output: `--short` prints the bare semver, `--json` the full record. */
export function cliVersionOutput(
	version: string,
	argv: readonly string[],
	options: CliVersionOptions = {},
): string {
	if (argv.includes('--short')) return `${version}\n`;
	if (argv.includes('--json')) return `${JSON.stringify(cliVersionInfo(version, options))}\n`;
	return `${cliVersion(version, options)}\n`;
}
