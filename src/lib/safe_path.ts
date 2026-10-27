import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { GrimoireValidationError } from '../errors.ts';

export const SEGMENT_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LEGACY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export function assertSpellName(name: string): void {
	assertSegment(name, 'name');
}
export function assertChapter(chapter: string): void {
	assertSegment(chapter, 'chapter');
}
function assertSegment(value: string, field: string): void {
	if (
		typeof value !== 'string' ||
		value.length > 64 ||
		SEGMENT_PATTERN.exec(value)?.[0] !== value
	) {
		throw new GrimoireValidationError(
			`${field} must match ${SEGMENT_PATTERN.source} and be at most 64 characters`,
		);
	}
}
export function parseSpellPath(path: string, strict = false): [string, string] {
	const parts = typeof path === 'string' ? path.split('/') : [];
	if (
		parts.length !== 2 ||
		parts.some((part) => LEGACY_PATTERN.exec(part)?.[0] !== part || part === '.' || part === '..')
	) {
		throw new GrimoireValidationError(
			'path must be exactly <chapter>/<name>, with valid directory segments',
		);
	}
	const chapter = parts[0] as string;
	const name = parts[1] as string;
	if (strict) {
		assertChapter(chapter);
		assertSpellName(name);
	}
	return [chapter, name];
}
function inside(base: string, target: string): void {
	const rel = relative(base, target);
	if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
		throw new GrimoireValidationError(`path ${target} must stay inside the root`);
	}
}
export function resolveInsideRoot(root: string, ...segments: string[]): string {
	let base = resolve(root);
	try {
		base = realpathSync(base);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	const target = resolve(base, ...segments);
	inside(base, target);
	let current = base;
	for (const part of relative(base, target).split(sep).filter(Boolean)) {
		current = resolve(current, part);
		try {
			if (lstatSync(current).isSymbolicLink()) {
				throw new GrimoireValidationError(`path ${current} resolves through a symbolic link`);
			}
			inside(base, realpathSync(current));
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			break;
		}
	}
	return target;
}
export function resolveSpellPath(root: string, path: string, strict = false): string {
	parseSpellPath(path, strict);
	return resolveInsideRoot(root, path);
}
