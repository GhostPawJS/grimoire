export const grimoireToolExamples: Record<string, Record<string, unknown>> = {
	search_grimoire: { query: 'post image VPS' },
	review_grimoire: { view: 'index' },
	inspect_grimoire_item: { path: 'ops/verify-release' },
	inscribe_spell: {
		name: 'verify-release',
		content:
			'---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS before installing.\n',
	},
	update_spell: {
		path: 'ops/verify-release',
		content:
			'---\nname: verify-release\ndescription: Verify release checksums\n---\nCheck SHA256SUMS and retry if the digest differs.\n',
	},
	hone_spell: {},
	manage_spell: { action: 'repair_all' },
	drop_note: { content: 'Verify the build before release.', source: 'practice' },
	manage_draft: {
		action: 'submit',
		title: 'Release checks',
		rationale: 'Capture checksum verification',
		chapter: 'ops',
		noteIds: [1],
	},
	run_catalogue: {},
	scout_skills: { action: 'search', query: 'pdf' },
};
