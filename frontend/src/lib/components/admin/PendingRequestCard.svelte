<script lang="ts">
	import AdminFarmCard from '$lib/components/admin/AdminFarmCard.svelte';
	import { REQUEST_TYPE_LABEL, REQUEST_TYPE_MODIFIER } from '$lib/constants/admin-request';
	import type { PendingRequest } from '$lib/types/admin';
	import { requestTimeLabel } from '$lib/utils/pending-request-adapter';

	interface Props {
		request: PendingRequest;
		onSelect?: (request: PendingRequest) => void;
	}

	let { request, onSelect }: Props = $props();
</script>

<AdminFarmCard
	farm={request.farm}
	badge={{
		label: REQUEST_TYPE_LABEL[request.requestType],
		modifier: REQUEST_TYPE_MODIFIER[request.requestType]
	}}
	timestamp={requestTimeLabel(request)}
	onSelect={() => onSelect?.(request)}
/>
