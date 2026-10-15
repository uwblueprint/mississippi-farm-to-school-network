<script lang="ts">
	import { gqlClient } from '$lib/graphqlClient';
	import { parseRejectionReason, type ParsedRejection } from '$lib/utils/rejection-reason';
	import { formatFullDate } from '$lib/utils/relative-time';

	const LATEST_FARM_REJECTION_QUERY = `
		query LatestFarmRejection($farmId: ID!) {
			latestFarmRejection(farmId: $farmId) {
				rejection_reason
				created_at
			}
		}
	`;

	interface Props {
		farmId: string;
		title?: string;
	}

	let { farmId, title = 'Previously Requested Changes' }: Props = $props();

	let rejection = $state<(ParsedRejection & { requestedAt: string }) | null>(null);

	$effect(() => {
		const id = farmId;
		rejection = null;
		gqlClient<{
			latestFarmRejection: { rejection_reason: string; created_at: string } | null;
		}>(LATEST_FARM_REJECTION_QUERY, { farmId: id })
			.then(({ latestFarmRejection }) => {
				if (id !== farmId || !latestFarmRejection) return;
				rejection = {
					...parseRejectionReason(latestFarmRejection.rejection_reason),
					requestedAt: latestFarmRejection.created_at
				};
			})
			// Supplementary context only; the review itself still works without it.
			.catch(() => {});
	});
</script>

{#if rejection && (rejection.reasons.length || rejection.comments)}
	<section class="previous-rejection" aria-label={title}>
		<div class="previous-rejection__header">
			<h3 class="previous-rejection__title">{title}</h3>
			<span class="previous-rejection__date">
				Requested {formatFullDate(rejection.requestedAt)}
			</span>
		</div>

		{#if rejection.reasons.length}
			<div class="previous-rejection__group">
				<p class="previous-rejection__label">Reason</p>
				<ul class="previous-rejection__reasons">
					{#each rejection.reasons as reason (reason)}
						<li class="request-pill request-pill--changes-requested">{reason}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if rejection.comments}
			<div class="previous-rejection__group">
				<p class="previous-rejection__label">Comments</p>
				<p class="previous-rejection__comments">{rejection.comments}</p>
			</div>
		{/if}
	</section>
{/if}
