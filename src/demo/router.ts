import { useEffect, useState } from 'preact/hooks';

export function navigate(path: string): void {
	const p = path.startsWith('/') ? path : `/${path}`;
	globalThis.location.hash = p;
}

export function readRoute(): string {
	const raw = globalThis.location?.hash ?? '';
	const path = raw.replace(/^#\/?/, '') || '/';
	return path.startsWith('/') ? path : `/${path}`;
}

export function useCurrentRoute(): string {
	const [route, setRoute] = useState(readRoute);
	useEffect(() => {
		const handler = () => setRoute(readRoute());
		window.addEventListener('hashchange', handler);
		return () => window.removeEventListener('hashchange', handler);
	}, []);
	return route;
}

export function parseSpellRoute(route: string): { chapter: string; name: string } | null {
	const m = /^\/spell\/([^/]+)\/([^/]+)\/?$/.exec(route);
	if (!m || !m[1] || !m[2]) return null;
	return { chapter: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) };
}

export function parseChapterRoute(route: string): string | null {
	const m = /^\/chapters\/([^/]+)\/?$/.exec(route);
	return m?.[1] !== undefined ? decodeURIComponent(m[1]) : null;
}
