import { navigate, useCurrentRoute } from './router.ts';

const NAV = [
	{ href: '/', label: 'Dashboard', sub: 'Overview and actions' },
	{ href: '/chapters', label: 'Chapters', sub: 'Spells by chapter' },
	{ href: '/inscribe', label: 'Inscribe', sub: 'Create a spell' },
	{ href: '/notes', label: 'Notes', sub: 'Observations inbox' },
	{ href: '/catalogue', label: 'Catalogue', sub: 'Health analysis' },
	{ href: '/scout', label: 'Scout', sub: 'Search and adopt' },
] as const;

export function Sidebar(props: {
	open: boolean;
	onToggle: () => void;
	onClose: () => void;
	onReset: (mode: 'blank' | 'seeded') => void;
	loading: boolean;
	sessionMode: string;
}) {
	const route = useCurrentRoute();
	const isActive = (href: string) =>
		href === '/' ? route === '/' || route === '' : route === href || route.startsWith(`${href}/`);

	return (
		<>
			<button type="button" class="hamburger" onClick={props.onToggle} aria-label="Toggle menu">
				Menu
			</button>
			{props.open ? (
				<button
					type="button"
					class="sidebar-backdrop"
					onClick={props.onToggle}
					aria-label="Close"
				/>
			) : null}
			<aside class={`sidebar ${props.open ? 'sidebar-open' : ''}`}>
				<div class="sidebar-brand">
					<h1>Spell Forge</h1>
					<small>Interactive demo</small>
				</div>
				<div class="sidebar-banner">
					Runs in your browser with an in-memory database. Nothing is saved. Refresh resets
					everything.
				</div>
				<nav class="sidebar-nav">
					{NAV.map((item) => (
						<button
							key={item.href}
							type="button"
							class={`nav-item ${isActive(item.href) ? 'nav-active' : ''}`}
							onClick={() => {
								navigate(item.href);
								props.onClose();
							}}
						>
							<span class="nav-item-label">{item.label}</span>
							<span class="nav-item-sub">{item.sub}</span>
						</button>
					))}
				</nav>
				<div class="sidebar-footer">
					<div class="sidebar-status">
						<span class={`dot ${props.loading ? 'loading' : ''}`} />
						{props.loading ? 'Loading…' : 'Ready'}
					</div>
					<div class="sidebar-status">Session: {props.sessionMode}</div>
					<div class="sidebar-reset">
						<button
							type="button"
							class="btn btn-secondary btn-sm"
							onClick={() => props.onReset('blank')}
						>
							Blank
						</button>
						<button
							type="button"
							class="btn btn-primary btn-sm"
							onClick={() => props.onReset('seeded')}
						>
							Seeded
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
