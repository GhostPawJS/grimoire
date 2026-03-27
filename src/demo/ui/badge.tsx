import type { Tier } from '../../git/types.ts';

const TIER_LABEL: Record<Tier, string> = {
	Uncheckpointed: 'UC',
	Apprentice: 'Appr',
	Journeyman: 'Jour',
	Expert: 'Exp',
	Master: 'Mast',
};

export function TierBadge(props: { tier: Tier }) {
	return (
		<span class={`badge badge-tier tier-${props.tier.replace(/[^a-z]/gi, '').toLowerCase()}`}>
			{TIER_LABEL[props.tier]}
		</span>
	);
}

export function SourceBadge(props: { source: string }) {
	return <span class="badge badge-source">{props.source}</span>;
}
