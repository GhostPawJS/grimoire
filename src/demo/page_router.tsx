import { PageCatalogue } from './page_catalogue.tsx';
import { PageChapters } from './page_chapters.tsx';
import { PageDashboard } from './page_dashboard.tsx';
import { PageInscribe } from './page_inscribe.tsx';
import { PageNotes } from './page_notes.tsx';
import { PageScout } from './page_scout.tsx';
import { PageSpellDetail } from './page_spell_detail.tsx';
import { parseChapterRoute, parseSpellRoute, useCurrentRoute } from './router.ts';

export function PageRouter() {
	const route = useCurrentRoute();
	const spell = parseSpellRoute(route);
	if (spell !== null) {
		return <PageSpellDetail chapter={spell.chapter} name={spell.name} />;
	}
	if (route === '/inscribe' || route === 'inscribe') {
		return <PageInscribe />;
	}
	if (route === '/notes' || route === 'notes') {
		return <PageNotes />;
	}
	if (route === '/catalogue' || route === 'catalogue') {
		return <PageCatalogue />;
	}
	if (route === '/scout' || route === 'scout') {
		return <PageScout />;
	}
	if (route.startsWith('/chapters')) {
		const ch = parseChapterRoute(route);
		return <PageChapters initialChapter={ch} />;
	}
	return <PageDashboard />;
}
