import { useEffect, useMemo, useState } from 'preact/hooks';
import { GrimoireValidationError } from '../errors.ts';
import { countBodyLines } from '../spec/count_body_lines.ts';
import { parseSkillMd } from '../spec/parse_skill_md.ts';
import { validateSkillMd } from '../spec/validate_skill_md.ts';
import { useGrimoire } from './context.ts';
import { demoInscribe } from './demo_operations.ts';
import { navigate } from './router.ts';
import { Panel } from './ui/index.ts';

const TEMPLATE = `---
name: my-new-spell
description: One sentence describing when to use this spell.
---

## When to use

## Steps

1. 
`;

export function PageInscribe() {
	const { store, db, mutate, toast, revision } = useGrimoire();
	const [name, setName] = useState('my-new-spell');
	const [chapter, setChapter] = useState('general');
	const [content, setContent] = useState(TEMPLATE);
	const chapters = useMemo(() => store.listChapters(), [store, revision]);
	useEffect(() => {
		const pre = sessionStorage.getItem('grimoire-demo-inscribe-prefill');
		if (pre !== null) {
			setContent(pre);
			sessionStorage.removeItem('grimoire-demo-inscribe-prefill');
		}
	}, []);

	const debounced = useDebounced(content, 300);
	const preview = useMemo(() => parseSkillMd(debounced), [debounced]);
	const validation = useMemo(() => validateSkillMd(debounced), [debounced]);

	return (
		<div class="page page-inscribe">
			<Panel
				title="Inscribe a spell"
				subtitle="Spells are SKILL.md files: YAML frontmatter plus a short procedural body."
			>
				<div class="form-grid">
					<label class="field">
						<span>Name (kebab-case)</span>
						<input
							class="input"
							value={name}
							onInput={(e) => setName((e.target as HTMLInputElement).value)}
						/>
					</label>
					<label class="field">
						<span>Chapter</span>
						<input
							class="input"
							list="chapter-list"
							value={chapter}
							onInput={(e) => setChapter((e.target as HTMLInputElement).value)}
						/>
						<datalist id="chapter-list">
							{chapters.map((c) => (
								<option key={c} value={c} />
							))}
						</datalist>
					</label>
				</div>
				<label class="field block">
					<span>SKILL.md</span>
					<textarea
						class="textarea-code"
						rows={16}
						value={content}
						onInput={(e) => setContent((e.target as HTMLTextAreaElement).value)}
					/>
				</label>
				<button
					type="button"
					class="btn btn-primary"
					onClick={() => {
						try {
							mutate(() => {
								const r = demoInscribe(store, db, {
									name: name.trim(),
									chapter: chapter.trim(),
									content,
								});
								toast(
									r.warnings.length > 0
										? `Inscribed with ${String(r.warnings.length)} duplication warnings`
										: 'Inscribed',
									true,
								);
								navigate(
									`/spell/${encodeURIComponent(r.spell.chapter)}/${encodeURIComponent(r.spell.name)}`,
								);
							});
						} catch (e) {
							toast(e instanceof GrimoireValidationError ? e.message : 'Failed', false);
						}
					}}
				>
					Inscribe
				</button>
			</Panel>

			<Panel title="Live preview" subtitle="Parsed frontmatter and validation (debounced).">
				{preview.ok ? (
					<dl class="kv">
						<dt>name</dt>
						<dd>{preview.frontmatter.name}</dd>
						<dt>description</dt>
						<dd>{preview.frontmatter.description}</dd>
					</dl>
				) : (
					<p class="text-danger">{preview.ok ? '' : preview.error}</p>
				)}
				<p class="text-muted">Body lines: {countBodyLines(debounced)}</p>
				{validation.valid ? (
					<p class="text-success">Validation passed</p>
				) : (
					<ul class="error-list">
						{validation.errors.map((x) => (
							<li key={x}>{x}</li>
						))}
					</ul>
				)}
			</Panel>
		</div>
	);
}

function useDebounced(value: string, ms: number): string {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}
