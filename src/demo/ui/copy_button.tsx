import { useState } from 'preact/hooks';

export function CopyButton(props: { text: string; label?: string }) {
	const [done, setDone] = useState(false);
	return (
		<button
			type="button"
			class="btn btn-secondary btn-sm"
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(props.text);
					setDone(true);
					setTimeout(() => setDone(false), 2000);
				} catch {
					setDone(false);
				}
			}}
		>
			{done ? 'Copied' : (props.label ?? 'Copy')}
		</button>
	);
}
