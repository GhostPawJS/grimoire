import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function downloadTarball(url: string, dest: string): Promise<void> {
	const tmpFile = join(tmpdir(), `grimoire-tarball-${String(Date.now())}.tar.gz`);
	mkdirSync(dest, { recursive: true });

	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to download tarball: ${String(response.status)} ${response.statusText}`,
			);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		writeFileSync(tmpFile, buffer);
		execSync(`tar xzf "${tmpFile}" --strip-components=1 -C "${dest}"`, { stdio: 'pipe' });
	} finally {
		try {
			rmSync(tmpFile, { force: true });
		} catch {
			// Best-effort cleanup.
		}
	}
}
