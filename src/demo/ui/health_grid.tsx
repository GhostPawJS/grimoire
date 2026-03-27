export function HealthGrid(props: { entries: ReadonlyArray<{ path: string; health: number }> }) {
	return (
		<div class="health-grid">
			{props.entries.map((e) => (
				<div
					key={e.path}
					class="health-cell"
					title={`${e.path}: ${e.health.toFixed(2)}`}
					style={{ opacity: 0.35 + e.health * 0.65 }}
				>
					<span class="health-cell-label">{e.path}</span>
				</div>
			))}
		</div>
	);
}
