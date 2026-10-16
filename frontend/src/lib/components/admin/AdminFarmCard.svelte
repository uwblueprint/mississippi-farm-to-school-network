<script lang="ts">
	import { MAP_TAG_MODIFIER } from '$lib/constants/admin-request';
	import type { PendingFarmDto } from '$lib/types/admin';
	import { pendingFarmMapTag, pendingFarmOwner } from '$lib/utils/pending-request-adapter';

	interface Props {
		farm: PendingFarmDto;
		/** Leading status pill, styled by the matching `request-pill--{modifier}` class. */
		badge: { label: string; modifier: string };
		/** Right-aligned timestamp text, e.g. "Submitted 2 hours ago". */
		timestamp: string;
		/** When set, the whole card is a button that calls this on click. */
		onSelect?: () => void;
	}

	let { farm, badge, timestamp, onSelect }: Props = $props();

	const owner = $derived(pendingFarmOwner(farm));
	const mapTag = $derived(pendingFarmMapTag(farm));
</script>

{#snippet content()}
	<div class="request-card__meta">
		<div class="request-card__tags">
			<span class="request-pill request-pill--{badge.modifier}">{badge.label}</span>
			{#if mapTag}
				<span class="request-card__dot"></span>
				<span class="request-pill request-pill--{MAP_TAG_MODIFIER[mapTag]}">
					{mapTag}
				</span>
			{/if}
		</div>
		<span class="request-card__submitted">{timestamp}</span>
	</div>

	<div class="request-card__body">
		<div class="request-card__details">
			<div class="request-card__farm">
				<h2 class="request-card__farm-name">{farm.farm_name}</h2>
				<p class="request-card__farm-address">{farm.farm_address}</p>
			</div>

			<div class="request-card__separator"></div>

			<div class="request-card__owner">
				{#if owner.name}
					<p class="request-card__owner-name">{owner.name}</p>
				{/if}
				<p>{owner.email}</p>
				{#if owner.phone}
					<p>{owner.phone}</p>
				{/if}
			</div>
		</div>

		{#if onSelect}
			<img class="request-card__chevron" src="/images/common/chevronRightIcon.svg" alt="" />
		{/if}
	</div>
{/snippet}

{#if onSelect}
	<button type="button" class="request-card" onclick={onSelect}>
		{@render content()}
	</button>
{:else}
	<article class="request-card request-card--static">
		{@render content()}
	</article>
{/if}
