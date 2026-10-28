export const grimoireCheatCommands = [
	['search', 'post image VPS'],
	['search', 'set up a recurring reminder'],
	['review', 'index'],
	['review', 'index', '--format', 'prompt'],
	['inspect', 'ops/verify-release'],
	['spell', 'inscribe', 'verify-release', '--content', '@SKILL.md', '--chapter', 'ops'],
	['spell', 'inscribe', 'verify-release', '--force', '--content', '@SKILL.md', '--chapter', 'ops'],
	['spell', 'inscribe', 'verify-release', '-'],
	['spell', 'update', 'ops/verify-release', '--content', '@-'],
	['spell', 'hone', 'ops/verify-release', '--message', 'Add recovery', '--note-ids', '3'],
	['spell', 'hone', '--paths', 'ops/verify-release', '--note_ids', '3'],
	['note', 'drop', 'Checksum mismatch', '--source', 'failure', '--domain', 'ops'],
	['review', 'notes'],
	['catalogue', 'run', '--now', '2026-10-28'],
	[
		'draft',
		'submit',
		'Release checks',
		'--rationale',
		'Capture evidence',
		'--note-ids',
		'3',
		'--chapter',
		'ops',
	],
	['draft', 'approve', '1'],
	['spell', 'shelve', 'ops/verify-release'],
	['spell', 'unshelve', 'ops/verify-release'],
	['spell', 'move', 'ops/verify-release', 'ops/verify-checksum'],
	['spell', 'rollback', 'ops/verify-release', 'deadbeef'],
	['spell', 'repair', 'ops/verify-release'],
	['spell', 'repair-all'],
	['spell', 'delete', 'ops/verify-release'],
	['scout', 'adopt', './skills', '--chapter', 'imported'],
	['skill', '--list'],
	['skill', 'search-and-retrieve-spells'],
	['tools'],
	['describe', 'hone_spell'],
];

export const grimoireCheatSheet = `## CLI cheat sheet

State: DB = --db / GHOSTPAW_GRIMOIRE_DB / ~/.ghostpaw/grimoire.db; root = --root / GHOSTPAW_GRIMOIRE_ROOT / ~/.ghostpaw/grimoire.
Git history lives at <ROOT>/.grimoire-git; override with --git-dir or GHOSTPAW_GRIMOIRE_GIT_DIR.
A spell is <chapter>/<name>/SKILL.md with optional scripts/, references/, and assets/. Copy the folder to export it.
Rank counts distinct commits per spell: Uncheckpointed 0, Apprentice 1–2, Journeyman 3–5, Expert 6–9, Master 10+.
Search uses multiple terms across names, descriptions, and bodies with stemming and fuzzy metadata matching.
Inscribe conflicts when the destination exists; --force replaces it. Identical content and no-change hone return no_op.
Hone accepts positional paths and --paths. Both --note-ids and --note_ids work for hone and draft submit.
Inspect shows rollback hashes in history. Updates require hone to checkpoint changes.
Spell --content accepts @file, @- for stdin and @@ for a literal leading @; every other value is literal. A final - reads JSON stdin (including spell inscribe <name> -).
--now accepts epoch milliseconds, ISO 8601 date-time, and YYYY-MM-DD. Inspect history and catalogue dates are ISO.
Write results are compact; --verbose includes full spell content. review index --format prompt returns only the formatted block in data.
Output: --json, --compact, --quiet. Exit codes: 0 success/no_op, 1 tool error, 2 usage, 3 not found/clarification, 4 conflict, 70 internal error.
Catalogue health fields measure honing pressure; recently sealed spells may score zero. Dormancy has a 14-day grace period after the first seal.

\`\`\`sh
${grimoireCheatCommands.map((args) => `ghostpaw-grimoire ${args.map((arg) => (/^[a-zA-Z0-9_@./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", "'\\''")}'`)).join(' ')}`).join('\n')}
\`\`\``;
