import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export async function downloadTarball(url: string, dest: string): Promise<void> {
	const tempDir = mkdtempSync(join(tmpdir(), 'grimoire-tarball-'));
	const tmpFile = join(tempDir, 'archive.tar.gz');
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
		execFileSync('tar', ['xzf', tmpFile, '--strip-components=1', '-C', dest, '--no-same-owner'], {
			stdio: 'pipe',
		});
	} finally {
		try {
			rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Best-effort cleanup.
		}
	}
}
