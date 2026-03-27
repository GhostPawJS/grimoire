import { useMemo, useState } from 'preact/hooks';
import { GrimoireValidationError } from '../errors.ts';
import { logEvent } from '../events/log_event.ts';
import { searchIndex } from '../registry/search_index.ts';
import type { RegistryEntry, SearchResult } from '../registry/types.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { useGrimoire } from './context.ts';
import { demoInscribe } from './demo_operations.ts';
import { adoptFromGitHub, getGitHubRateLimit, searchGitHubLive } from './demo_search.ts';
import { navigate } from './router.ts';
import { Panel, SourceBadge } from './ui/index.ts';

type Mode = 'local' | 'github';

export function PageScout() {
	const { db, store, mutate, toast, revision } = useGrimoire();
	const [mode, setMode] = useState<Mode>('local');
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(false);
	const [remote, setRemote] = useState<SearchResult[]>([]);

	const localResults = useMemo((): RegistryEntry[] => {
		if (query.trim() === '') return [];
		return searchIndex(db, query);
	}, [db, query, revision]);

	async function adoptRaw(raw: string): Promise<void> {
		const parsed = parseSkillMd(raw);
		if (!parsed.ok) {
			toast('Invalid SKILL.md', false);
			return;
		}
		const chapter = 'general';
		const spellName = parsed.frontmatter.name;
		const target = `${chapter}/${spellName}`;
		if (store.has(target)) {
			toast('That spell already exists locally', false);
			return;
		}
		mutate(() => {
			try {
				demoInscribe(store, db, { name: spellName, chapter, content: raw });
				logEvent(db, { spell: target, event: 'adopt' });
				toast(`Adopted ${spellName}`, true);
				navigate(`/spell/${encodeURIComponent(chapter)}/${encodeURIComponent(spellName)}`);
			} catch (e) {
				toast(e instanceof GrimoireValidationError ? e.message : 'Adopt failed', false);
			}
		});
	}

	return (
		<div class="page">
			<Panel
				title="Scout skills"
				subtitle="Local Index searches the pre-seeded marketplace snapshot. GitHub Live uses the public search API."
			>
				<div class="toggle-row">
					<button
						type="button"
						class={mode === 'local' ? 'btn btn-primary' : 'btn btn-secondary'}
						onClick={() => setMode('local')}
					>
						Local index
					</button>
					<button
						type="button"
						class={mode === 'github' ? 'btn btn-primary' : 'btn btn-secondary'}
						onClick={() => setMode('github')}
					>
						GitHub live
					</button>
				</div>
				<label class="field block">
					<span>Search</span>
					<input
						class="input"
						value={query}
						onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
						placeholder={mode === 'local' ? 'Filter local index…' : 'GitHub code search…'}
					/>
				</label>
				{mode === 'github' ? (
					<p class="text-muted">Rate limit remaining: {String(getGitHubRateLimit().remaining)}</p>
				) : null}
				{mode === 'github' ? (
					<button
						type="button"
						class="btn btn-secondary"
						disabled={loading || query.trim() === ''}
						onClick={() => {
							setLoading(true);
							void searchGitHubLive(query.trim())
								.then((r) => {
									setRemote(r);
									toast(`Found ${String(r.length)} results`, true);
								})
								.catch((e: unknown) => {
									toast(e instanceof Error ? e.message : 'Search failed', false);
								})
								.finally(() => setLoading(false));
						}}
					>
						{loading ? 'Searching…' : 'Search GitHub'}
					</button>
				) : null}
			</Panel>

			<div class="results-grid">
				{(mode === 'local' ? localResults : remote).map((r) => {
					const key = `${r.source}:${r.slug}`;
					const desc = r.description ?? '—';
					const repo = r.sourceRepo;

					return (
						<div key={key} class="result-card">
							<div class="result-card-head">
								<strong>{r.name}</strong>
								<SourceBadge source={r.source} />
							</div>
							<p class="result-desc">{desc ?? '—'}</p>
							{repo !== null ? (
								<a
									class="text-link"
									href={`https://github.com/${repo}`}
									target="_blank"
									rel="noreferrer"
								>
									{repo}
								</a>
							) : null}
							<button
								type="button"
								class="btn btn-primary btn-sm"
								onClick={() => {
									void (async () => {
										try {
											let raw: string;
											if (mode === 'local') {
												const fe = r as RegistryEntry;
												if (fe.fetchUrl === null) {
													toast('No fetch URL for this entry', false);
													return;
												}
												const res = await fetch(fe.fetchUrl);
												if (!res.ok) {
													toast(`Fetch failed: ${String(res.status)}`, false);
													return;
												}
												raw = await res.text();
											} else {
												const gh = r as SearchResult;
												raw = await adoptFromGitHub(gh.sourceRepo, gh.sourcePath ?? 'SKILL.md');
											}
											await adoptRaw(raw);
										} catch (e) {
											toast(e instanceof Error ? e.message : 'Failed', false);
										}
									})();
								}}
							>
								Adopt
							</button>
						</div>
					);
				})}
			</div>
		</div>
	);
}
