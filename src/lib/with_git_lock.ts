import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { GrimoireStateError } from '../errors.ts';

const held = new Set<string>();
export function withGitLock<T>(gitDir: string, perform: () => T): T {
	const directory = resolve(gitDir);
	if (held.has(directory)) return perform();
	mkdirSync(directory, { recursive: true });
	const path = join(directory, 'grimoire.lock');
	const start = Date.now();
	const sleeper = new Int32Array(new SharedArrayBuffer(4));
	let delay = 10;
	for (;;) {
		try {
			const fd = openSync(path, 'wx');
			try {
				writeFileSync(fd, JSON.stringify({ pid: process.pid, timestamp: Date.now() }));
			} finally {
				closeSync(fd);
			}
			break;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
			try {
				const lock = JSON.parse(readFileSync(path, 'utf8')) as { pid: number; timestamp: number };
				let stale = Date.now() - lock.timestamp > 60_000;
				try {
					process.kill(lock.pid, 0);
				} catch (cause) {
					if ((cause as NodeJS.ErrnoException).code === 'ESRCH') stale = true;
				}
				if (stale && existsSync(path)) {
					rmSync(path, { force: true });
					continue;
				}
			} catch {
				/* A writer may still be filling in the lock file. Recover abandoned partial locks only after the stale interval. */
				try {
					if (Date.now() - statSync(path).mtimeMs > 60_000) {
						rmSync(path, { force: true });
						continue;
					}
				} catch {
					/* The lock may have been released. */
				}
			}
			if (Date.now() - start >= 10_000)
				throw new GrimoireStateError(
					`Timed out waiting for Git lock ${path}. Retry after the active writer finishes.`,
				);
			Atomics.wait(sleeper, 0, 0, delay);
			delay = Math.min(delay * 2, 100);
		}
	}
	held.add(directory);
	try {
		return perform();
	} finally {
		held.delete(directory);
		rmSync(path, { force: true });
	}
}
