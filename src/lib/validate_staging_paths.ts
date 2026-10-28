import { lstatSync, readdirSync } from 'node:fs';
import { relative } from 'node:path';
import { GrimoireValidationError } from '../errors.ts';
import { resolveInsideRoot } from './safe_path.ts';

export function validateStagingPaths(root: string, paths: readonly string[]): void {
	const visit = (path: string): void => {
		const absolute = resolveInsideRoot(root, path);
		let stat: ReturnType<typeof lstatSync>;
		try {
			stat = lstatSync(absolute);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
			throw error;
		}
		if (stat.isDirectory()) {
			for (const entry of readdirSync(absolute)) visit(`${path}/${entry}`);
		} else if (!stat.isFile()) {
			throw new GrimoireValidationError(
				`path ${relative(root, absolute)} must be a regular file or directory`,
			);
		}
	};
	for (const path of paths) visit(path.replace(/\/$/, ''));
}
