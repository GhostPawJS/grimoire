import { useMemo, useState } from 'preact/hooks';
import { logEvent } from '../events/log_event.ts';
import { mapEventRow } from '../events/map_event_row.ts';
import { resonance } from '../events/resonance.ts';
import type { SpellEventRow } from '../events/types.ts';
import { pendingNotes } from '../notes/pending_notes.ts';
import { getProvenance } from '../provenance/get_provenance.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { useGrimoire } from './context.ts';
import { demoDeleteSpell, demoGetSpell } from './demo_operations.ts';
import { navigate } from './router.ts';
import { CopyButton, Panel } from './ui/index.ts';

export function PageSpellDetail(props: { chapter: string; name: string }) {
	const { store, db, mutate, toast } = useGrimoire();
	const path = `${props.chapter}/${props.name}`;
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState('');

	const spell = useMemo(() => {
		try {
			return demoGetSpell(store, path);
		} catch {
			return undefined;
		}
	}, [store, path, editing]);

	const raw = useMemo(() => store.get(path), [store, path, editing]);

	const validation = useMemo(() => (raw !== undefined ? validateSkillMd(raw) : undefined), [raw]);

	const prov = useMemo(() => getProvenance(db, path), [db, path]);

	const notes = useMemo(
		() => pendingNotes(db).filter((n) => n.domain?.includes(props.chapter)),
		[db, props.chapter],
	);

	const events = useMemo(() => {
		const rows = db
			.prepare(
				'SELECT id, spell, event, context_id, ts FROM spell_events WHERE spell = ? ORDER BY id DESC LIMIT 20',
			)
			.all<SpellEventRow>(path);
		return rows.map(mapEventRow);
	}, [db, path]);

	const res = useMemo(() => resonance(db, path), [db, path]);

	if (spell === undefined || raw === undefined) {
		return (
			<div class="page">
				<p>Spell not found.</p>
				<button type="button" class="btn btn-secondary" onClick={() => navigate('/chapters')}>
					Back to chapters
				</button>
			</div>
		);
	}

	const fullMd = raw;

	return (
		<div class="page">
			<div class="page-header">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<button type="button" class="link-button" onClick={() => navigate('/chapters')}>
						Chapters
					</button>
					<span class="sep">/</span>
					<span>{spell.chapter}</span>
					<span class="sep">/</span>
					<h1 class="page-title-inline">{spell.name}</h1>
				</nav>
				<div class="page-header-meta">
					<span class="text-muted">Rank {spell.rank}</span>
					<span class="badge">{spell.tier}</span>
					<span class="text-muted">
						Resonance: {res.weightedReads.toFixed(2)} weighted · {res.color}
					</span>
				</div>
			</div>

			<div class="page-actions">
				<CopyButton text={fullMd} label="Copy SKILL.md" />
				<button
					type="button"
					class="btn btn-secondary"
					onClick={() => {
						setDraft(raw);
						setEditing(true);
					}}
				>
					Edit
				</button>
				<button
					type="button"
					class="btn btn-secondary"
					onClick={() => {
						const next = window.prompt('Move to chapter (folder name):', spell.chapter);
						if (!next || next === spell.chapter) return;
						mutate(() => {
							const np = store.moveSpell(path, next.trim());
							logEvent(db, { spell: np, event: 'move' });
							toast(`Moved to ${np}`, true);
							navigate(
								`/spell/${encodeURIComponent(next.trim())}/${encodeURIComponent(spell.name)}`,
							);
						});
					}}
				>
					Move
				</button>
				<button
					type="button"
					class="btn btn-secondary"
					onClick={() => {
						mutate(() => {
							store.shelve(path);
							logEvent(db, { spell: path, event: 'shelve' });
							toast('Shelved', true);
							navigate('/chapters');
						});
					}}
				>
					Shelve
				</button>
				<button
					type="button"
					class="btn btn-danger"
					onClick={() => {
						if (!window.confirm(`Delete ${path}?`)) return;
						mutate(() => {
							demoDeleteSpell(store, path);
							toast('Deleted', true);
							navigate('/chapters');
						});
					}}
				>
					Delete
				</button>
			</div>

			{editing ? (
				<Panel title="Edit SKILL.md">
					<textarea
						class="textarea-code"
						rows={18}
						value={draft}
						onInput={(e) => setDraft((e.target as HTMLTextAreaElement).value)}
					/>
					<div class="form-actions">
						<button
							type="button"
							class="btn btn-primary"
							onClick={() => {
								mutate(() => {
									store.set(path, draft);
									setEditing(false);
									toast('Saved', true);
								});
							}}
						>
							Save
						</button>
						<button type="button" class="btn btn-secondary" onClick={() => setEditing(false)}>
							Cancel
						</button>
					</div>
				</Panel>
			) : null}

			<div class="grid-2">
				<Panel title="Body" subtitle={`${countBodyLines(raw)} lines`}>
					<pre class="code-block">{spell.body}</pre>
				</Panel>
				<Panel title="Frontmatter">
					<dl class="kv">
						{Object.entries(spell.frontmatter).map(([k, v]) => (
							<div key={k} class="kv-row">
								<dt>{k}</dt>
								<dd>{typeof v === 'string' ? v : JSON.stringify(v)}</dd>
							</div>
						))}
					</dl>
				</Panel>
			</div>

			<Panel title="Validation">
				{validation?.valid ? (
					<p class="text-success">Valid SKILL.md</p>
				) : (
					<ul class="error-list">
						{validation?.errors.map((e) => (
							<li key={e}>{e}</li>
						))}
					</ul>
				)}
				{validation?.warnings !== undefined && validation.warnings.length > 0 ? (
					<ul class="warn-list">
						{validation.warnings.map((w) => (
							<li key={w}>{w}</li>
						))}
					</ul>
				) : null}
			</Panel>

			{prov !== undefined ? (
				<Panel title="Provenance">
					<dl class="kv">
						<dt>Source</dt>
						<dd>{prov.sourceType}</dd>
						<dt>Repo</dt>
						<dd>{prov.sourceRepo ?? '—'}</dd>
					</dl>
				</Panel>
			) : null}

			<Panel
				title="Notes mentioning this chapter"
				subtitle="Filtered by note domain containing the chapter name."
			>
				<ul class="list-plain">
					{notes.length === 0 ? <li class="text-muted">None</li> : null}
					{notes.map((n) => (
						<li key={n.id}>
							<strong>{n.source}</strong>: {n.content}
						</li>
					))}
				</ul>
			</Panel>

			<Panel title="Events">
				<ul class="list-plain">
					{events.map((e) => (
						<li key={e.id}>
							<code>{e.event}</code> <span class="text-muted">{new Date(e.ts).toISOString()}</span>
						</li>
					))}
				</ul>
			</Panel>
		</div>
	);
}
