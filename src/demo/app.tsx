import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import type { GrimoireDb } from '../database.ts';
import { GrimoireContext } from './context.ts';
import { createDemoSession } from './demo_session.ts';
import { PageRouter } from './page_router.tsx';
import { ToastStack, useToastState } from './result_toast.tsx';
import { readRoute } from './router.ts';
import { Sidebar } from './sidebar.tsx';
import type { VirtualSpellStore } from './virtual_spell_store.ts';

const TITLES: Record<string, string> = {
	'/': 'Spell Forge',
	'/chapters': 'Spell Forge — Chapters',
	'/inscribe': 'Spell Forge — Inscribe',
	'/notes': 'Spell Forge — Notes',
	'/catalogue': 'Spell Forge — Catalogue',
	'/scout': 'Spell Forge — Scout',
};

export function App() {
	const [db, setDb] = useState<GrimoireDb | null>(null);
	const [store, setStore] = useState<VirtualSpellStore | null>(null);
	const [revision, setRevision] = useState(0);
	const [loading, setLoading] = useState(true);
	const [sessionMode, setSessionMode] = useState<'blank' | 'seeded'>('seeded');
	const [sessionError, setSessionError] = useState<string | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { toasts, push } = useToastState();
	const dbRef = useRef<GrimoireDb | null>(null);
	dbRef.current = db;

	const replaceSession = useCallback(async (mode: 'blank' | 'seeded') => {
		setLoading(true);
		setSessionError(null);
		try {
			dbRef.current?.close();
			setDb(null);
			setStore(null);
			const next = await createDemoSession(mode);
			setDb(next.db);
			setStore(next.store);
			setSessionMode(mode);
			setRevision(0);
		} catch (e) {
			setSessionError(e instanceof Error ? e.message : 'Session failed');
			setDb(null);
			setStore(null);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void replaceSession('seeded');
	}, [replaceSession]);

	useEffect(() => {
		const path = readRoute();
		document.title = TITLES[path] ?? 'Spell Forge';
		const onHash = () => {
			const p = readRoute();
			document.title = TITLES[p] ?? 'Spell Forge';
		};
		window.addEventListener('hashchange', onHash);
		return () => window.removeEventListener('hashchange', onHash);
	}, []);

	const mutate = useCallback((fn: () => void) => {
		fn();
		setRevision((n) => n + 1);
	}, []);

	const toast = useCallback((message: string, ok = true) => push(message, ok), [push]);

	if (sessionError !== null) {
		return (
			<div class="boot-screen">
				<p class="text-danger">{sessionError}</p>
			</div>
		);
	}

	if (loading || db === null || store === null) {
		return (
			<div class="boot-screen">
				<p>Loading Spell Forge…</p>
			</div>
		);
	}

	return (
		<GrimoireContext.Provider value={{ db, store, revision, mutate, toast }}>
			<div class="demo-layout">
				<Sidebar
					open={sidebarOpen}
					onToggle={() => setSidebarOpen((o) => !o)}
					onClose={() => setSidebarOpen(false)}
					onReset={(mode) => void replaceSession(mode)}
					loading={false}
					sessionMode={sessionMode}
				/>
				<main class="demo-main">
					<PageRouter />
				</main>
				<ToastStack toasts={toasts} />
			</div>
		</GrimoireContext.Provider>
	);
}
