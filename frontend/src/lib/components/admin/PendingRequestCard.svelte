<script lang="ts">
	import {
		MAP_TAG_MODIFIER,
		REQUEST_TYPE_LABEL,
		REQUEST_TYPE_MODIFIER
	} from '$lib/constants/admin-request';
	import type { PendingRequest } from '$lib/types/admin';
	import { pendingFarmMapTag, pendingFarmOwner } from '$lib/utils/pending-request-adapter';
	import { formatRelativeTime } from '$lib/utils/relative-time';

	interface Props {
		request: PendingRequest;
		onSelect?: (request: PendingRequest) => void;
	}

	let { request, onSelect }: Props = $props();

	const owner = $derived(pendingFarmOwner(request.farm));
	const mapTag = $derived(pendingFarmMapTag(request.farm));
	const submittedLabel = $derived(`Submitted ${formatRelativeTime(request.farm.updatedAt)}`);
</script>

<button type="button" class="request-card" onclick={() => onSelect?.(request)}>
	<div class="request-card__meta">
		<div class="request-card__tags">
			<span class="request-pill request-pill--{REQUEST_TYPE_MODIFIER[request.requestType]}">
				{REQUEST_TYPE_LABEL[request.requestType]}
			</span>
			{#if mapTag}
				<span class="request-card__dot"></span>
				<span class="request-pill request-pill--{MAP_TAG_MODIFIER[mapTag]}">
					{mapTag}
				</span>
			{/if}
		</div>
		<span class="request-card__submitted">{submittedLabel}</span>
	</div>

	<div class="request-card__body">
		<div class="request-card__details">
			<div class="request-card__farm">
				<h2 class="request-card__farm-name">{request.farm.farm_name}</h2>
				<p class="request-card__farm-address">{request.farm.farm_address}</p>
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
