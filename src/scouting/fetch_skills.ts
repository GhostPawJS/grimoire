import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cloneRepo } from './clone_repo.ts';
import { downloadTarball } from './download_tarball.ts';
import { resolveSource } from './resolve_source.ts';
import { scanStaging } from './scan_staging.ts';
import type { FetchHandle, ResolvedSource } from './types.ts';

export async function fetchSkills(source: string): Promise<FetchHandle> {
	const resolved = resolveSource(source);

	if (resolved.type === 'local') {
		const localDir = resolved.url ?? source;
		const skills = scanStaging(localDir);
		return {
			source,
			skills,
			cleanup: () => {},
		};
	}

	const stagingDir = mkdtempSync(join(tmpdir(), 'grimoire-scout-'));

	try {
		const resolvedRepo = await fetchToStaging(resolved, stagingDir);
		const skills = scanStaging(stagingDir);

		return {
			source,
			...(resolvedRepo !== undefined ? { resolvedRepo } : {}),
			skills,
			cleanup: () => {
				try {
					rmSync(stagingDir, { recursive: true, force: true });
				} catch {
					// Best-effort cleanup.
				}
			},
		};
	} catch (err) {
		try {
			rmSync(stagingDir, { recursive: true, force: true });
		} catch {
			// Best-effort cleanup.
		}
		throw err;
	}
}

async function fetchToStaging(
	resolved: ResolvedSource,
	stagingDir: string,
): Promise<string | undefined> {
	switch (resolved.type) {
		case 'agentskillhub': {
			const response = await fetch(`https://agentskillhub.dev/api/v1/skills/${resolved.slug}`);
			if (!response.ok) {
				throw new Error(
					`AgentSkillHub lookup failed: ${String(response.status)} ${response.statusText}`,
				);
			}
			const data = (await response.json()) as { repo?: string; ref?: string };
			if (!data.repo) {
				throw new Error('AgentSkillHub response missing repo field');
			}
			const url = `https://codeload.github.com/${data.repo}/tar.gz/${data.ref ?? 'HEAD'}`;
			await downloadTarball(url, stagingDir);
			return data.repo;
		}

		case 'github': {
			const ref = resolved.ref ?? 'HEAD';
			const url = `https://codeload.github.com/${resolved.owner}/${resolved.repo}/tar.gz/${ref}`;
			await downloadTarball(url, stagingDir);
			return `${resolved.owner}/${resolved.repo}`;
		}

		case 'git': {
			const gitUrl = resolved.url ?? '';
			await cloneRepo(gitUrl, stagingDir, resolved.ref);
			return gitUrl;
		}

		default:
			return undefined;
	}
}
