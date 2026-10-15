<script lang="ts">
	import {
		INACTIVE_KIND_LABEL,
		INACTIVE_KIND_MODIFIER,
		MAP_TAG_MODIFIER
	} from '$lib/constants/admin-request';
	import type { InactiveFarm } from '$lib/types/admin';
	import { pendingFarmMapTag, pendingFarmOwner } from '$lib/utils/pending-request-adapter';
	import { formatRelativeTime } from '$lib/utils/relative-time';

	interface Props {
		item: InactiveFarm;
		onSelect?: (item: InactiveFarm) => void;
		/** Shows a Restore button on deleted farms, so admins needn't open the farm. */
		onRestore?: (item: InactiveFarm) => void;
		restoring?: boolean;
	}

	let { item, onSelect, onRestore, restoring = false }: Props = $props();

	const restorable = $derived(item.kind === 'DELETED' && Boolean(onRestore));

	const owner = $derived(pendingFarmOwner(item.farm));
	const mapTag = $derived(pendingFarmMapTag(item.farm));
	const timeLabel = $derived(
		`${item.kind === 'DELETED' ? 'Deleted' : 'Changes requested'} ${formatRelativeTime(item.farm.updatedAt)}`
	);
</script>

<div class="inactive-card">
	<button
		type="button"
		class="request-card"
		class:request-card--restorable={restorable}
		onclick={() => onSelect?.(item)}
	>
		<div class="request-card__meta">
			<div class="request-card__tags">
				<span class="request-pill request-pill--{INACTIVE_KIND_MODIFIER[item.kind]}">
					{INACTIVE_KIND_LABEL[item.kind]}
				</span>
				{#if mapTag}
					<span class="request-card__dot"></span>
					<span class="request-pill request-pill--{MAP_TAG_MODIFIER[mapTag]}">
						{mapTag}
					</span>
				{/if}
			</div>
			<span class="request-card__submitted">{timeLabel}</span>
		</div>

		<div class="request-card__body">
			<div class="request-card__details">
				<div class="request-card__farm">
					<h2 class="request-card__farm-name">{item.farm.farm_name}</h2>
					<p class="request-card__farm-address">{item.farm.farm_address}</p>
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

			<img class="request-card__chevron" src="/images/common/chevronRightIcon.svg" alt="" />
		</div>
	</button>
	{#if restorable}
		<button
			type="button"
			class="inactive-card__restore"
			disabled={restoring}
			aria-label="Restore {item.farm.farm_name}"
			onclick={() => onRestore?.(item)}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			{restoring ? 'Restoring…' : 'Restore'}
		</button>
	{/if}
</div>
