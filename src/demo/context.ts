import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { GrimoireDb } from '../database.ts';
import type { VirtualSpellStore } from './virtual_spell_store.ts';

export interface GrimoireDemoContext {
	db: GrimoireDb;
	store: VirtualSpellStore;
	revision: number;
	mutate: (fn: () => void) => void;
	toast: (message: string, ok?: boolean) => void;
}

export const GrimoireContext = createContext<GrimoireDemoContext | null>(null);

export function useGrimoire(): GrimoireDemoContext {
	const ctx = useContext(GrimoireContext);
	if (ctx === null) {
		throw new Error('useGrimoire must be used inside GrimoireContext.Provider');
	}
	return ctx;
}
