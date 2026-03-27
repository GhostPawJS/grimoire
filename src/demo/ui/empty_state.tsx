import type { ComponentChildren } from 'preact';

export function EmptyState(props: {
	title: string;
	message: string;
	children?: ComponentChildren;
}) {
	return (
		<div class="empty-state">
			<h3>{props.title}</h3>
			<p>{props.message}</p>
			{props.children}
		</div>
	);
}
