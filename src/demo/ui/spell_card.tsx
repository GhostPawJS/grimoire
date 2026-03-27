import type { ResonanceResult } from '../../events/types.ts';
import type { Tier } from '../../git/types.ts';
import { TierBadge } from './badge.tsx';

export function SpellCard(props: {
	name: string;
	description: string;
	tier: Tier;
	resonance?: ResonanceResult;
	bodyLines: number;
	onClick: () => void;
}) {
	return (
		<button type="button" class="spell-card" onClick={props.onClick}>
			<div class="spell-card-top">
				<span class="spell-card-name">{props.name}</span>
				<TierBadge tier={props.tier} />
			</div>
			<p class="spell-card-desc">{props.description}</p>
			<div class="spell-card-meta">
				<span class="text-muted">{props.bodyLines} lines</span>
				{props.resonance !== undefined ? (
					<span class={`resonance-dot resonance-${props.resonance.color}`} title="resonance" />
				) : null}
			</div>
		</button>
	);
}
