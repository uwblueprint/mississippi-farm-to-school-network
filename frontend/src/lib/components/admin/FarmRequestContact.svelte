<script lang="ts">
	import type { PendingFarmDto } from '$lib/types/admin';
	import { pendingFarmOwner } from '$lib/utils/pending-request-adapter';

	interface Props {
		farm: PendingFarmDto;
	}

	let { farm }: Props = $props();

	const owner = $derived(pendingFarmOwner(farm));
	const facebook = $derived(
		typeof farm.social_media?.facebook === 'string' ? farm.social_media.facebook : null
	);
	const instagram = $derived(
		typeof farm.social_media?.instagram === 'string' ? farm.social_media.instagram : null
	);

	function joinList(values: string[]): string {
		return values.join(', ');
	}
</script>

<div class="farm-request-modal__contact">
	<div class="farm-request-modal__contact-row">
		<img src="/images/admin/addressIcon.svg" alt="" />
		<span class="farm-request-modal__contact-label">Address</span>
		<span class="farm-request-modal__contact-value">{farm.farm_address}</span>
	</div>
	<div class="farm-request-modal__contact-row">
		<img src="/images/admin/countyIcon.svg" alt="" />
		<span class="farm-request-modal__contact-label">County</span>
		<span class="farm-request-modal__contact-value">{farm.county}</span>
	</div>
	{#if farm.cities_served.length}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/countyIcon.svg" alt="" />
			<span class="farm-request-modal__contact-label">Cities Served</span>
			<span class="farm-request-modal__contact-value">{joinList(farm.cities_served)}</span>
		</div>
	{/if}
	{#if owner.name}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/ownerIcon.svg" alt="" />
			<span class="farm-request-modal__contact-label">Owner</span>
			<span class="farm-request-modal__contact-value">{owner.name}</span>
		</div>
	{/if}
	{#if owner.phone}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/phoneIcon.svg" alt="" />
			<span class="farm-request-modal__contact-label">Phone Number</span>
			<span class="farm-request-modal__contact-value">{owner.phone}</span>
		</div>
	{/if}
	<div class="farm-request-modal__contact-row">
		<img src="/images/admin/emailIcon.svg" alt="" />
		<span class="farm-request-modal__contact-label">Email</span>
		<span class="farm-request-modal__contact-value">{owner.email}</span>
	</div>
	{#if farm.website}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/emailIcon.svg" alt="" />
			<span class="farm-request-modal__contact-label">Website</span>
			<span class="farm-request-modal__contact-value">
				<a href={farm.website} target="_blank" rel="noopener noreferrer">{farm.website}</a>
			</span>
		</div>
	{/if}
	{#if facebook}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/facebookIcon.png" alt="" />
			<span class="farm-request-modal__contact-label">Facebook</span>
			<span class="farm-request-modal__contact-value">{facebook}</span>
		</div>
	{/if}
	{#if instagram}
		<div class="farm-request-modal__contact-row">
			<img src="/images/admin/facebookIcon.png" alt="" />
			<span class="farm-request-modal__contact-label">Instagram</span>
			<span class="farm-request-modal__contact-value">{instagram}</span>
		</div>
	{/if}
</div>
