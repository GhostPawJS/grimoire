import { useMemo } from 'preact/hooks';
import { readCatalogue } from '../health/read_catalogue.ts';
import { useGrimoire } from './context.ts';
import { demoCatalogue } from './demo_operations.ts';
import { BarChart, HealthGrid, Panel } from './ui/index.ts';

export function PageCatalogue() {
	const { db, store, mutate, toast, revision } = useGrimoire();
	const snap = useMemo(() => readCatalogue(db), [db, revision]);

	const chapterSegments = useMemo(() => {
		if (snap === undefined) return [];
		const entries = Object.entries(snap.chapterDistribution);
		const max = Math.max(1, ...entries.map(([, v]) => v));
		return entries.map(([label, value]) => ({ label, value, max }));
	}, [snap]);

	const healthEntries = useMemo(() => {
		if (snap === undefined) return [];
		return Object.entries(snap.spellHealth).map(([path, health]) => ({ path, health }));
	}, [snap]);

	return (
		<div class="page">
			<Panel
				title="Catalogue pass"
				subtitle="A catalogue run computes staleness, health, orphan note clusters, and chapter balance from your spells and notes."
			>
				<button
					type="button"
					class="btn btn-primary"
					onClick={() => {
						mutate(() => {
							demoCatalogue(store, db);
							toast('Catalogue saved', true);
						});
					}}
				>
					Run catalogue
				</button>
			</Panel>

			{snap === undefined ? (
				<Panel title="No snapshot yet">
					<p class="text-muted">Run a catalogue pass to populate health metrics.</p>
				</Panel>
			) : (
				<>
					<Panel title="Summary">
						<p>
							Computed at {snap.computedAt} — {snap.totalSpells} spells, {snap.pendingNotes} pending
							notes, {snap.draftsQueued} drafts.
						</p>
					</Panel>
					<Panel title="Chapter distribution">
						<BarChart title="Spells per chapter" segments={chapterSegments} />
					</Panel>
					<Panel title="Spell health">
						<HealthGrid entries={healthEntries} />
					</Panel>
					<Panel title="Stale / dormant / oversized">
						<ul class="list-plain">
							<li>Stale: {snap.staleSpells.join(', ') || '—'}</li>
							<li>Dormant: {snap.dormantSpells.join(', ') || '—'}</li>
							<li>Oversized: {snap.oversizedSpells.join(', ') || '—'}</li>
						</ul>
					</Panel>
					<Panel title="Orphan clusters">
						<ul class="list-plain">
							{snap.orphanClusters.length === 0 ? (
								<li class="text-muted">None</li>
							) : (
								snap.orphanClusters.map((c, i) => (
									<li key={i}>
										{c.memberCount} notes · terms: {c.suggestedTerms.join(', ')}
									</li>
								))
							)}
						</ul>
					</Panel>
				</>
			)}
		</div>
	);
}
