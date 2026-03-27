import { useMemo, useState } from 'preact/hooks';
import { pendingDrafts } from '../drafts/pending_drafts.ts';
import { allResonance } from '../events/all_resonance.ts';
import { mapEventRow } from '../events/map_event_row.ts';
import type { SpellEventRow } from '../events/types.ts';
import { readCatalogue } from '../health/read_catalogue.ts';
import { pendingNoteCount } from '../notes/pending_note_count.ts';
import { useGrimoire } from './context.ts';
import { navigate } from './router.ts';
import { Panel } from './ui/panel.tsx';

const WELCOME_KEY = 'grimoire-demo-welcome-collapsed';

export function PageDashboard() {
	const { db, store, revision } = useGrimoire();
	const [collapsed, setCollapsed] = useState(() =>
		typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(WELCOME_KEY) === '1' : false,
	);

	const stats = useMemo(() => {
		const chapters = store.listChapters().length;
		const spells = store.listPaths().length;
		const notes = pendingNoteCount(db);
		const drafts = pendingDrafts(db).length;
		return { chapters, spells, notes, drafts };
	}, [db, store, revision]);

	const resonance = useMemo(() => {
		const all = allResonance(db);
		return Object.entries(all)
			.sort((a, b) => b[1].weightedReads - a[1].weightedReads)
			.slice(0, 5);
	}, [db, revision]);

	const recent = useMemo(() => {
		const rows = db
			.prepare(
				'SELECT id, spell, event, context_id, ts FROM spell_events ORDER BY id DESC LIMIT 12',
			)
			.all<SpellEventRow>();
		return rows.map(mapEventRow);
	}, [db, revision]);

	const health = useMemo(() => readCatalogue(db), [db, revision]);

	return (
		<div class="page">
			<Panel
				title="Welcome to the Spell Forge"
				subtitle="A grimoire is a library of spells — reusable procedures stored as SKILL.md files."
			>
				<button
					type="button"
					class="btn btn-link"
					onClick={() => {
						const next = !collapsed;
						setCollapsed(next);
						if (typeof sessionStorage !== 'undefined') {
							sessionStorage.setItem(WELCOME_KEY, next ? '1' : '');
						}
					}}
				>
					{collapsed ? 'Show intro' : 'Hide intro'}
				</button>
				{!collapsed ? (
					<div class="prose">
						<p>
							Use <strong>Chapters</strong> to browse spells, <strong>Inscribe</strong> to add new
							ones, <strong>Notes</strong> to capture observations, and <strong>Catalogue</strong>{' '}
							to run a health pass. <strong>Scout</strong> searches a local skill index or GitHub
							live.
						</p>
					</div>
				) : null}
			</Panel>

			<div class="stats-row">
				<div class="stat-card">
					<span class="stat-value">{stats.spells}</span>
					<span class="stat-label">Spells</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.chapters}</span>
					<span class="stat-label">Chapters</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.notes}</span>
					<span class="stat-label">Pending notes</span>
				</div>
				<div class="stat-card">
					<span class="stat-value">{stats.drafts}</span>
					<span class="stat-label">Drafts</span>
				</div>
			</div>

			<div class="quick-actions">
				<button type="button" class="btn btn-primary" onClick={() => navigate('/inscribe')}>
					Inscribe spell
				</button>
				<button type="button" class="btn btn-secondary" onClick={() => navigate('/notes')}>
					Drop note
				</button>
				<button type="button" class="btn btn-secondary" onClick={() => navigate('/catalogue')}>
					Run catalogue
				</button>
				<button type="button" class="btn btn-secondary" onClick={() => navigate('/scout')}>
					Scout skills
				</button>
			</div>

			<div class="grid-2">
				<Panel title="Resonance (top spells)" subtitle="Weighted reads from the event log.">
					<ul class="list-plain">
						{resonance.length === 0 ? (
							<li class="text-muted">No resonance data yet.</li>
						) : (
							resonance.map(([path, r]) => (
								<li key={path}>
									<button
										type="button"
										class="link-button"
										onClick={() => navigate(`/spell/${path}`)}
									>
										{path}
									</button>{' '}
									<span class="text-muted">
										{r.weightedReads.toFixed(2)} weighted · {r.readCount} reads
									</span>
								</li>
							))
						)}
					</ul>
				</Panel>

				<Panel title="Recent activity" subtitle="Latest events across the grimoire.">
					<ul class="list-plain">
						{recent.map((e) => (
							<li key={e.id}>
								<code>{e.event}</code> <span class="text-muted">{e.spell}</span>
							</li>
						))}
					</ul>
				</Panel>
			</div>

			<Panel
				title="Health snapshot"
				subtitle="From the last catalogue pass (run it on the Catalogue page)."
			>
				{health === undefined ? (
					<p class="text-muted">No catalogue snapshot yet.</p>
				) : (
					<ul class="list-plain">
						<li>
							Total spells: <strong>{health.totalSpells}</strong>
						</li>
						<li>
							Stale: {health.staleSpells.length} · Dormant: {health.dormantSpells.length} ·
							Oversized: {health.oversizedSpells.length}
						</li>
						<li>Pending notes in snapshot: {health.pendingNotes}</li>
					</ul>
				)}
			</Panel>
		</div>
	);
}
