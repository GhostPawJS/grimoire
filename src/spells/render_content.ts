import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GrimoireDb } from '../database.ts';
import { GrimoireNotFoundError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { allRanks } from '../git/all_ranks.ts';
import { isGitAvailable } from '../git/is_git_available.ts';
import { tier } from '../git/tier.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { assertSpellExists } from './assert_spell_exists.ts';
import type { RenderedContent } from './types.ts';

const COMPILED_HEADING_RE = /^##\s+(?:Compiled|Summary)\s*$/m;

function extractCompiledSummary(body: string): string | undefined {
	const match = COMPILED_HEADING_RE.exec(body);
	if (!match) return undefined;

	const start = match.index + match[0].length;
	const rest = body.slice(start);
	const nextHeading = rest.search(/^##\s+/m);
	const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
	return section.trim() || undefined;
}

export interface RenderContentOptions {
	contextId?: string | number;
	gitDir?: string;
}

export function renderContent(
	root: string,
	path: string,
	db?: GrimoireDb,
	options?: RenderContentOptions,
): RenderedContent {
	assertSpellExists(root, path);

	const skillMdPath = join(root, path, 'SKILL.md');
	const content = readFileSync(skillMdPath, 'utf-8');
	const parsed = parseSkillMd(content);

	if (!parsed.ok) {
		throw new GrimoireNotFoundError(
			`Failed to parse SKILL.md for spell: ${path} — ${parsed.error}`,
		);
	}

	const ranks = isGitAvailable()
		? allRanks({ root, ...(options?.gitDir !== undefined ? { gitDir: options.gitDir } : {}) })
		: {};
	const rank = ranks[path] ?? 0;
	const spellTier = tier(rank);

	if (db) {
		logEvent(db, {
			spell: path,
			event: 'read',
			...(options?.contextId !== undefined ? { contextId: options.contextId } : {}),
		});
	}

	const result: RenderedContent = {
		body: parsed.body,
		tier: spellTier,
		rank,
	};

	if (rank >= 6 && parsed.frontmatter.allowedTools) {
		result.allowedTools = parsed.frontmatter.allowedTools;
	}

	if (rank >= 10) {
		const summary = extractCompiledSummary(parsed.body);
		if (summary !== undefined) {
			result.compiledSummary = summary;
		}
	}

	return result;
}
