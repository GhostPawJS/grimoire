import { readFileSync } from 'node:fs';
import { grimoireSkills } from '../../src/skills/skill_registry.ts';
import { grimoireSkillSpec } from '../../src/surface/grimoire_skill_spec.ts';
import { grimoireSurfaceTools } from '../../src/surface/grimoire_surface_tools.ts';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
export const config = {
	slug: 'grimoire',
	skill: grimoireSkillSpec,
	workflows: grimoireSkills,
	manifest: {
		name: 'ghostpaw-grimoire',
		version: pkg.version,
		description: 'Local procedural knowledge with spells, notes, and revision history.',
		author: pkg.author,
		homepage: pkg.homepage,
		repository: pkg.repository.url,
		license: pkg.license,
		keywords: pkg.keywords,
		server: 'ghostpaw-grimoire',
		packageName: pkg.name,
		mcpName: 'io.github.GhostPawJS/grimoire',
		title: 'GhostPaw Grimoire',
		websiteUrl: pkg.homepage,
		environment: [
			{
				name: 'GHOSTPAW_GRIMOIRE_ROOT',
				description: 'Spells directory (default: ~/.ghostpaw/grimoire/)',
			},
			{
				name: 'GHOSTPAW_GRIMOIRE_DB',
				description: 'SQLite database path (default: ~/.ghostpaw/grimoire.db)',
			},
		],
	},
};

export const mcpbSpec = {
	...config.manifest,
	longDescription:
		'Local procedural knowledge with spells, notes, and revision history. Stores data in a local SQLite database.',
	documentation: 'https://github.com/GhostPawJS/grimoire/blob/main/README.md',
	support: pkg.bugs.url,
	entryPoint: 'server/mcp-server.js',
	env: {
		GHOSTPAW_GRIMOIRE_DB: `\${user_config.db_path}`,
		GHOSTPAW_GRIMOIRE_ROOT: `\${user_config.root_path}`,
	},
	userConfig: {
		root_path: {
			type: 'string',
			title: 'Spells directory',
			description: 'Local spells directory.',
			required: false,
			default: `\${HOME}/.ghostpaw/grimoire`,
		},
		db_path: {
			type: 'string',
			title: 'Database path',
			description: 'Path to the local SQLite database.',
			required: false,
			default: `\${HOME}/.ghostpaw/grimoire.db`,
		},
	},
	tools: grimoireSurfaceTools.map(({ name, description }) => ({ name, description })),
};
