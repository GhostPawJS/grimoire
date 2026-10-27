import { npmEntry } from './npm_entry.ts';

export function markNpmEntry(): void {
	npmEntry.active = true;
}
