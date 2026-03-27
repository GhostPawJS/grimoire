import { useEffect, useMemo, useState } from 'preact/hooks';
import { resonance } from '../events/resonance.ts';
import { tier } from '../git/tier.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { useGrimoire } from './context.ts';
import { navigate } from './router.ts';
import { EmptyState, Panel, SpellCard } from './ui/index.ts';

export function PageChapters(props: { initialChapter: string | null }) {
	const { store, db, revision } = useGrimoire();
	const chapters = useMemo(() => store.listChapters(), [store, revision]);
	const [tab, setTab] = useState(props.initialChapter ?? chapters[0] ?? '');

	useEffect(() => {
		if (props.initialChapter !== null && chapterExists(chapters, props.initialChapter)) {
			setTab(props.initialChapter);
		}
	}, [props.initialChapter, chapters]);

	const spells = useMemo(() => {
		const list = store.discoverSpells().filter((s) => s.chapter === tab);
		return list;
	}, [store, tab, revision]);

	if (chapters.length === 0) {
		return (
			<div class="page">
				<EmptyState
					title="No spells yet"
					message="A spell is a folder with SKILL.md. Create one with Inscribe."
				>
					<button type="button" class="btn btn-primary" onClick={() => navigate('/inscribe')}>
						Inscribe
					</button>
				</EmptyState>
			</div>
		);
	}

	const effectiveTab = chapterExists(chapters, tab) ? tab : (chapters[0] ?? '');

	return (
		<div class="page">
			<Panel title="Chapters" subtitle="Browse spells by chapter.">
				<div class="chapter-tabs" role="tablist">
					{chapters.map((ch) => (
						<button
							key={ch}
							type="button"
							role="tab"
							aria-selected={ch === effectiveTab}
							class={`chapter-tab ${ch === effectiveTab ? 'active' : ''}`}
							onClick={() => {
								setTab(ch);
								navigate(`/chapters/${encodeURIComponent(ch)}`);
							}}
						>
							{ch}
							<span class="tab-count">
								{store.discoverSpells().filter((s) => s.chapter === ch).length}
							</span>
						</button>
					))}
				</div>
				<div class="spell-grid">
					{spells.map((s) => {
						const raw = store.get(s.path);
						const parsed = raw !== undefined ? parseSkillMd(raw) : { ok: false as const };
						const desc = parsed.ok ? parsed.frontmatter.description : '';
						const bodyLines = raw !== undefined ? countBodyLines(raw) : 0;
						const res = resonance(db, s.path);
						const rk = 0;
						return (
							<SpellCard
								key={s.path}
								name={s.name}
								description={desc}
								tier={tier(rk)}
								resonance={res}
								bodyLines={bodyLines}
								onClick={() =>
									navigate(`/spell/${encodeURIComponent(s.chapter)}/${encodeURIComponent(s.name)}`)
								}
							/>
						);
					})}
				</div>
				<div class="fab-actions">
					<button type="button" class="btn btn-primary" onClick={() => navigate('/inscribe')}>
						Inscribe spell
					</button>
				</div>
			</Panel>
		</div>
	);
}

function chapterExists(chapters: string[], ch: string): boolean {
	return chapters.includes(ch);
}
