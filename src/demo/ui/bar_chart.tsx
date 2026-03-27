export function BarChart(props: {
	title: string;
	segments: ReadonlyArray<{ label: string; value: number; max: number }>;
}) {
	return (
		<div class="bar-chart">
			<div class="bar-chart-title">{props.title}</div>
			{props.segments.map((s) => (
				<div key={s.label} class="bar-row">
					<span class="bar-label">{s.label}</span>
					<div class="bar-track">
						<div
							class="bar-fill"
							style={{ width: s.max > 0 ? `${(s.value / s.max) * 100}%` : '0%' }}
						/>
					</div>
					<span class="bar-value">{s.value}</span>
				</div>
			))}
		</div>
	);
}
