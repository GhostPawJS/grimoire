import type { ComponentChildren } from 'preact';

export function Panel(props: {
	title?: string;
	subtitle?: string;
	children: ComponentChildren;
	className?: string;
}) {
	return (
		<section class={`panel ${props.className ?? ''}`}>
			{props.title !== undefined ? (
				<header class="panel-header">
					<h2>{props.title}</h2>
					{props.subtitle !== undefined ? <p class="panel-sub">{props.subtitle}</p> : null}
				</header>
			) : null}
			<div class="panel-body">{props.children}</div>
		</section>
	);
}
