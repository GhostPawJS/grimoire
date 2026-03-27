import { useMemo, useState } from 'preact/hooks';
import { dropNote } from '../notes/drop_note.ts';
import { noteCounts } from '../notes/note_counts.ts';
import { pendingNotes } from '../notes/pending_notes.ts';
import { useGrimoire } from './context.ts';
import { navigate } from './router.ts';
import { Panel } from './ui/index.ts';

export function PageNotes() {
	const { db, mutate, toast, revision } = useGrimoire();
	const [source, setSource] = useState('demo');
	const [content, setContent] = useState('');
	const [domain, setDomain] = useState('');
	const [routeById, setRouteById] = useState<Record<string, string>>({});

	const notes = useMemo(() => pendingNotes(db), [db, revision]);
	const counts = useMemo(() => noteCounts(db), [db, revision]);

	const byDomain = useMemo(() => {
		const m = new Map<string, typeof notes>();
		for (const n of notes) {
			const d = n.domain ?? 'uncategorized';
			const list = m.get(d) ?? [];
			list.push(n);
			m.set(d, list);
		}
		return m;
	}, [notes]);

	return (
		<div class="page">
			<Panel
				title="Notes inbox"
				subtitle="Notes are observations that can later be distilled into spells or routed toward a chapter."
			>
				<div class="form-grid">
					<label class="field">
						<span>Source</span>
						<input
							class="input"
							value={source}
							onInput={(e) => setSource((e.target as HTMLInputElement).value)}
						/>
					</label>
					<label class="field">
						<span>Domain (optional)</span>
						<input
							class="input"
							value={domain}
							onInput={(e) => setDomain((e.target as HTMLInputElement).value)}
						/>
					</label>
				</div>
				<label class="field block">
					<span>Content</span>
					<textarea
						class="textarea"
						rows={4}
						value={content}
						onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
					/>
				</label>
				<button
					type="button"
					class="btn btn-primary"
					onClick={() => {
						if (!content.trim()) return;
						mutate(() => {
							dropNote(db, {
								source: source.trim(),
								content: content.trim(),
								...(domain.trim() !== '' ? { domain: domain.trim() } : {}),
							});
							setContent('');
							toast('Note recorded', true);
						});
					}}
				>
					Drop note
				</button>
			</Panel>

			<Panel title="Counts by source / domain">
				<ul class="list-plain">
					{counts.map((c) => (
						<li key={`${c.source}-${c.domain ?? 'null'}`}>
							{c.source} / {c.domain ?? '—'}: {c.count}
						</li>
					))}
				</ul>
			</Panel>

			<Panel title="Pending notes">
				{[...byDomain.entries()].map(([d, list]) => (
					<div key={d} class="note-group">
						<h3>{d}</h3>
						<ul class="list-plain">
							{list.map((n) => (
								<li key={n.id} class="note-card">
									<p>{n.content}</p>
									<div class="note-actions">
										<input
											class="input input-sm"
											placeholder="route domain"
											value={routeById[n.id] ?? ''}
											onInput={(e) => {
												const v = (e.target as HTMLInputElement).value;
												setRouteById((prev) => ({ ...prev, [n.id]: v }));
											}}
										/>
										<button
											type="button"
											class="btn btn-secondary btn-sm"
											onClick={() => {
												const dom = (routeById[n.id] ?? '').trim();
												if (!dom) {
													toast('Enter a domain', false);
													return;
												}
												mutate(() => {
													db.prepare('UPDATE spell_notes SET domain = ? WHERE id = ?').run(
														dom,
														n.id,
													);
													setRouteById((prev) => {
														const next = { ...prev };
														delete next[n.id];
														return next;
													});
													toast('Routed', true);
												});
											}}
										>
											Save domain
										</button>
										<button
											type="button"
											class="btn btn-secondary btn-sm"
											onClick={() => {
												sessionStorage.setItem(
													'grimoire-demo-inscribe-prefill',
													`---\nname: distilled-note\ndescription: Distilled from a note.\n---\n\n${n.content}\n`,
												);
												navigate('/inscribe');
											}}
										>
											Distill into Inscribe
										</button>
									</div>
								</li>
							))}
						</ul>
					</div>
				))}
			</Panel>
		</div>
	);
}
