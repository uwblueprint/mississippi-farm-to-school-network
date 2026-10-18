<script lang="ts">
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import ChoiceGroup from '$lib/components/ChoiceGroup.svelte';
	import UploadZone from '$lib/components/UploadZone.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import RequestedChangesCard from '$lib/components/RequestedChangesCard.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { IMAGE_ACCEPT, MAX_UPLOAD_LABEL } from '$lib/fileDrop';
	import { preparePhotos } from '$lib/utils/prepare-photo';
	import { formModelToUpdateInput } from '$lib/farmMapping';
	import { uploadFarmPhoto } from '$lib/utils/farm-image-upload';
	import {
		NONE_OF_THE_ABOVE,
		GROWING_PRACTICES,
		SEASONAL_PRODUCTS,
		MEAT_PRODUCTS,
		OTHER_PRODUCTS,
		FOOD_SAFETY_CERTIFICATIONS,
		FARM_EXPERIENCES,
		FARM_CHARACTERISTICS,
		FARM_TO_SCHOOL_SALES
	} from '$lib/constants/farmOptions';

	let { data }: { data: PageData } = $props();

	// The [id] segment is the farm's UUID — the same id used by the backend
	// farmById(id) query and the updateFarm(id, input) / resubmitFarm(id, input) mutations.
	const farmId = $derived($page.params.id ?? '');

	/** Safe in-app path from `?returnTo=` (e.g. admin → edit → back to /admin). */
	function safeReturnTo(value: string | null): string | null {
		if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
		return value;
	}

	const backHref = $derived(
		safeReturnTo($page.url.searchParams.get('returnTo')) ?? '/farmer/farms'
	);

	// --- GraphQL mutations (client-side; auth via Firebase ID token) ---------
	const UPDATE_FARM = `
		mutation UpdateFarm($id: ID!, $input: UpdateFarmInput!) {
			updateFarm(id: $id, input: $input) { id status }
		}
	`;
	const RESUBMIT_FARM = `
		mutation ResubmitFarm($id: ID!, $input: UpdateFarmInput!) {
			resubmitFarm(id: $id, input: $input) { id status }
		}
	`;
	const REQUEST_FARM_DELETION = `
		mutation RequestFarmDeletion($id: ID!) {
			requestFarmDeletion(id: $id) { id deletion_requested_at }
		}
	`;
	const DELETE_IMAGE = `
		mutation DeleteImage($imageId: String!) {
			deleteImage(imageId: $imageId)
		}
	`;

	// --- Form state ---------------------------------------------------------
	// Backend-mapped fields, seeded from the loader (farmToFormModel). The
	// checkbox groups live in here too (not separate local state) so that
	// formModelToUpdateInput actually sends them on save.
	const farm = $state({ ...data.form });

	// Checkbox option labels come from $lib/constants/farmOptions (the frontend
	// mirror of the backend's allowed values); the selected labels are stored
	// verbatim in the backend string-array columns. The backend also accepts
	// "None of the above" for these two groups.
	const GROWING_PRACTICE_OPTIONS = [...GROWING_PRACTICES, NONE_OF_THE_ABOVE];
	const FOOD_SAFETY_OPTIONS = [...FOOD_SAFETY_CERTIFICATIONS, NONE_OF_THE_ABOVE];

	// The two image buckets, resolved by the loader from cover_photo /
	// carousel_photos (`images` ids) + getImages. Derived from `data`
	// rather than copied into `farm` so they track uploads/removals across
	// invalidateAll(). Writes are based on the PERSISTED ids (coverId/galleryIds),
	// not the display subset, so a transiently unresolvable file is never evicted.
	const galleryPhotos = $derived(data.gallery.map((img) => ({ id: img.fileId, url: img.url })));
	const galleryIds = $derived(data.galleryIds);
	const coverId = $derived(data.coverId);
	const dashboardImage = $derived(data.cover);

	const MAX_GALLERY_PHOTOS = 10;

	let saving = $state(false);
	let uploading = $state(false);
	let actionError = $state('');
	let galleryInput = $state<HTMLInputElement | null>(null);
	let confirmingDelete = $state(false);
	let deleting = $state(false);
	let deleteError = $state('');

	function openDeleteConfirm() {
		deleteError = '';
		confirmingDelete = true;
	}

	function closeDeleteConfirm() {
		if (!deleting) confirmingDelete = false;
	}

	// Sends the deletion request to the admin queue; the farm stays live (and on
	// the map) until an admin approves it, and the dashboard shows it as
	// Deletion Pending meanwhile.
	async function handleDeleteFarm() {
		if (deleting) return;
		deleting = true;
		deleteError = '';
		try {
			await gqlClient(REQUEST_FARM_DELETION, { id: farmId });
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Could not request deletion.';
			deleting = false;
			return;
		}
		deleting = false;
		confirmingDelete = false;
		await goto(backHref, { invalidateAll: true });
	}

	// Persist the clean editable fields. REJECTED farms resubmit (re-enters the
	// approval queue); all others use updateFarm.
	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		actionError = '';
		const resubmitting = data.status === 'REJECTED';
		try {
			const input = formModelToUpdateInput(farm);
			await gqlClient(resubmitting ? RESUBMIT_FARM : UPDATE_FARM, { id: farmId, input });
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Save failed.';
			return;
		} finally {
			saving = false;
		}
		// Saved: leave the form for where the user came from (the farm list, or the
		// admin page via ?returnTo=), which reloads with the updated farm/status.
		await goto(backHref, { invalidateAll: true });
	}

	// Persist a bucket assignment (cover_photo / carousel_photos hold `images`
	// ids). Sent separately from the main Save so image edits are immediate and
	// never clobber unsaved field edits. ALWAYS writes both columns from the
	// current state (+ the change), so the first edit of a legacy farm (files
	// but empty columns) persists the displayed split instead of losing the
	// other bucket.
	async function assignImages(next: { cover?: string | null; gallery?: string[] }) {
		const cover = next.cover !== undefined ? next.cover : coverId;
		const input: { cover_photo?: string; carousel_photos: string[] } = {
			carousel_photos: next.gallery ?? galleryIds
		};
		if (cover) input.cover_photo = cover;
		await gqlClient(UPDATE_FARM, { id: farmId, input });
	}

	// Upload each usable file into the `images` collection (same path as
	// new-farm). Every upload surface (pickers and drops) reaches here, so the
	// size limit and HEIC conversion are applied once, per file.
	async function uploadImageFiles(files: File[]): Promise<string[]> {
		const { photos, errors } = await preparePhotos(files);
		actionError = errors.join(' ');
		if (photos.length === 0) return [];

		const imageIds: string[] = [];
		for (const file of photos) {
			imageIds.push(await uploadFarmPhoto(farmId, file));
		}
		return imageIds;
	}

	// Dashboard Image bucket: exactly one file becomes the cover (the zone is
	// multiple={false}; the slice guards the programmatic path). The replaced
	// cover file is deleted best-effort so it doesn't linger as an orphan.
	async function handleCoverFiles(files: FileList | null) {
		if (!files || files.length === 0 || uploading) return;
		uploading = true;
		try {
			const previousCoverId = coverId;
			const [fileId] = await uploadImageFiles(Array.from(files).slice(0, 1));
			if (fileId) {
				await assignImages({ cover: fileId });
				if (
					previousCoverId &&
					previousCoverId !== fileId &&
					!galleryIds.includes(previousCoverId)
				) {
					try {
						await gqlClient(DELETE_IMAGE, { imageId: previousCoverId });
					} catch {
						// best-effort cleanup; an orphaned old cover is harmless
					}
				}
			}
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Upload failed.';
		} finally {
			// Files uploaded before an error are already persisted, so refresh either way.
			await invalidateAll();
			uploading = false;
		}
	}

	// Photo Gallery bucket: uploads append to carousel_photos, capped at
	// MAX_GALLERY_PHOTOS. On legacy farms (files but empty bucket columns)
	// assignImages also persists the displayed cover.
	async function handleGalleryFiles(files: FileList | null) {
		if (!files || files.length === 0 || uploading) return;
		const remaining = MAX_GALLERY_PHOTOS - galleryIds.length;
		if (remaining <= 0) {
			actionError = `The gallery is full (${MAX_GALLERY_PHOTOS} photos max).`;
			return;
		}
		uploading = true;
		try {
			const fileIds = await uploadImageFiles(Array.from(files).slice(0, remaining));
			if (files.length > remaining) {
				actionError = `Only ${remaining} more photo${remaining === 1 ? '' : 's'} fit — the gallery holds ${MAX_GALLERY_PHOTOS}.`;
			}
			if (fileIds.length > 0) await assignImages({ gallery: [...galleryIds, ...fileIds] });
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Upload failed.';
		} finally {
			await invalidateAll();
			uploading = false;
		}
	}

	function handleGalleryChange(event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		if (el.files && el.files.length > 0) handleGalleryFiles(el.files);
		// reset so picking the same file again still fires a change event
		el.value = '';
	}

	// Shares the `uploading` gate with the upload handlers: concurrent
	// full-array carousel writes would clobber each other (last write wins).
	async function removePhoto(fileId: string) {
		if (uploading) return;
		uploading = true;
		actionError = '';
		try {
			// Unreference first, then delete the blob: if the delete fails the file
			// is merely orphaned (invisible), never a dangling gallery entry.
			await assignImages({ gallery: galleryIds.filter((id) => id !== fileId) });
			await gqlClient(DELETE_IMAGE, { imageId: fileId });
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Remove failed.';
		} finally {
			await invalidateAll();
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Edit farm</title>
</svelte:head>

{#snippet actionBar()}
	<div class="action-bar">
		<ActionButton variant="outline" size="sm" href={backHref}>
			{#snippet iconLeft()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M19 12H5M12 5L5 12L12 19"
						stroke="#696C78"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/snippet}
			Back
		</ActionButton>

		<ActionButton variant="primary" size="sm" type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save'}
			{#snippet iconRight()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M20 6L9 17L4 12"
						stroke="white"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/snippet}
		</ActionButton>
	</div>
{/snippet}

<!-- Hidden picker used by the public PhotoGallery "Add Photos" tile. -->
<input
	bind:this={galleryInput}
	class="visually-hidden-file"
	type="file"
	accept={IMAGE_ACCEPT}
	multiple
	onchange={handleGalleryChange}
/>

<!-- Client-side save (auth via Firebase ID token in gqlClient). Fields bind to
     `farm` state directly, so no hidden mirror inputs are needed. The save action
     routes to resubmitFarm when REJECTED, else updateFarm (see handleSave). -->
<form class="edit-page" onsubmit={handleSave}>
	{@render actionBar()}

	<h1 class="edit-title">Edit {farm.name}</h1>

	{#if data.rejection}
		<RequestedChangesCard reason={data.rejection.reason} />
	{/if}

	{#if actionError}
		<p class="form-error" role="alert">{actionError}</p>
	{/if}

	<!-- Bucket 1: the cover image shown on the farm dashboard card (cover_photo). -->
	<section class="section">
		<span class="section__subtitle">Dashboard Image</span>
		<UploadZone
			title="Upload new farm photo"
			hint={`JPG, PNG or HEIC, up to ${MAX_UPLOAD_LABEL}`}
			multiple={false}
			onFiles={handleCoverFiles}
			disabled={uploading}
		/>
		{#if dashboardImage?.url}
			<img
				class="dashboard-image"
				src={dashboardImage.url}
				alt={dashboardImage.originalFileName || 'Current dashboard image'}
			/>
		{/if}
	</section>

	<!-- Bucket 2: the photo gallery (carousel_photos) — its own upload square,
	     with the grid below holding the images uploaded to this gallery. -->
	<section class="section">
		<span class="section__subtitle">Photo Gallery</span>
		<p class="section__hint">
			*Optional: Upload photos of your farm, operations, and/or products here for people to see when
			they look at your farm!
		</p>
		<UploadZone
			title="Upload farm photos"
			hint={`JPG, PNG or HEIC, up to 10 pics (${MAX_UPLOAD_LABEL} each)`}
			onFiles={handleGalleryFiles}
			disabled={uploading}
		/>
		<PhotoGallery
			photos={galleryPhotos}
			onAdd={() => galleryInput?.click()}
			onFiles={handleGalleryFiles}
			onRemove={removePhoto}
			disabled={uploading}
		/>
	</section>

	<section class="section">
		<h2 class="section__heading">Farm Basics</h2>

		<TextInput size="lg" label="Farm ID#" value={farm.readableId} readonly />

		<TextInput size="lg" label="Farm Name" bind:value={farm.name} />
		<TextInput size="lg" label="Farm address" bind:value={farm.address} />
		<TextInput size="lg" label="County" bind:value={farm.county} />
		<TextInput size="lg" label="Cities Served" bind:value={farm.cities} />
		<p class="field-note">Separate multiple cities with commas.</p>
	</section>

	<section class="section">
		<h2 class="section__heading">Primary Contact Information</h2>

		<div class="field-grid">
			<TextInput size="lg" label="Phone Number" bind:value={farm.phone} />
			<TextInput size="lg" label="Email Address" bind:value={farm.email} />
			<TextInput size="lg" label="*Optional: Instagram" bind:value={farm.instagram} />
			<TextInput size="lg" label="*Optional: Facebook" bind:value={farm.facebook} />
			<TextInput size="lg" label="*Optional: Website" bind:value={farm.website} />
			<TextInput
				size="lg"
				label="*Optional: Other (social media + username)"
				bind:value={farm.other}
			/>
		</div>
	</section>

	<section class="section">
		<h2 class="section__heading">Farm Profile</h2>

		<!-- Each group binds the selected labels verbatim to its backend
		     string-array column (see farmMapping / $lib/constants/farmOptions). -->
		<ChoiceGroup
			label="Growing Practices"
			options={GROWING_PRACTICE_OPTIONS}
			exclusive={NONE_OF_THE_ABOVE}
			bind:value={farm.growingPractices}
		/>

		<ChoiceGroup
			label="Seasonal Products"
			options={SEASONAL_PRODUCTS}
			bind:value={farm.seasonalProducts}
		/>
		<ChoiceGroup label="Meat Products" options={MEAT_PRODUCTS} bind:value={farm.meatProducts} />
		<ChoiceGroup label="Other Products" options={OTHER_PRODUCTS} bind:value={farm.otherProducts} />

		<!-- seasonal_products_detail — free-text detail for the products above. -->
		<TextInput
			size="lg"
			label="Seasonal product and products offered"
			bind:value={farm.seasonal}
			multiline
		/>

		<ChoiceGroup
			label="Food Safety & Certifications"
			options={FOOD_SAFETY_OPTIONS}
			exclusive={NONE_OF_THE_ABOVE}
			bind:value={farm.foodSafety}
		/>
		<ChoiceGroup
			label="Farm Experiences & Services"
			options={FARM_EXPERIENCES}
			bind:value={farm.experiences}
		/>
		<ChoiceGroup
			label="Farm Characteristics"
			options={FARM_CHARACTERISTICS}
			bind:value={farm.characteristics}
		/>
		<ChoiceGroup
			label="Farm to School Sales"
			options={FARM_TO_SCHOOL_SALES}
			bind:value={farm.schoolSales}
		/>
	</section>

	<div class="footer-actions">
		{#if data.deletionRequested}
			<p class="deletion-pending" role="status">
				Deletion requested — MFSN will review it shortly. Your farm stays on the map until then.
			</p>
		{:else}
			<button type="button" class="delete-farm-btn" onclick={openDeleteConfirm}>
				Delete Farm
			</button>
		{/if}
	</div>

	{@render actionBar()}
</form>

{#if confirmingDelete}
	<Modal label="Delete farm" onClose={closeDeleteConfirm}>
		<div class="delete-confirm">
			<span class="delete-confirm__icon" aria-hidden="true">!</span>
			<h2 class="delete-confirm__title">Are you sure you want to delete your farm?</h2>
			<p class="delete-confirm__body">
				This sends a deletion request for <strong>{farm.name}</strong> to MFSN. Your farm stays on the
				Farm Fresh Map until the request is approved.
			</p>
			{#if deleteError}
				<p class="form-error" role="alert">{deleteError}</p>
			{/if}
			<div class="delete-confirm__actions">
				<ActionButton
					variant="outline-primary"
					size="sm"
					disabled={deleting}
					onclick={closeDeleteConfirm}
				>
					Cancel
				</ActionButton>
				<button
					type="button"
					class="delete-confirm__submit"
					disabled={deleting}
					onclick={handleDeleteFarm}
				>
					{deleting ? 'Deleting…' : 'Delete Farm'}
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	/* Sized to match the Create a Farm form (/new-farm): 760px column, 26px
	   title, 20px section headings, 15px labels, 14px inputs. */
	.edit-page {
		padding: 40px 24px 64px;
		display: flex;
		flex-direction: column;
		gap: 18px;
		width: 100%;
		max-width: 760px;
		margin: 0 auto;
		box-sizing: border-box;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: #131927;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.edit-page > .action-bar:first-child {
		margin-bottom: 2px;
	}

	.edit-page > .action-bar:last-child {
		margin-top: 12px;
	}

	.edit-title {
		margin: 0;
		font-size: 26px;
		font-weight: 500;
		line-height: normal;
		color: #131927;
	}

	/* Hidden file input driving the public gallery "Add Photos" tile. */
	.visually-hidden-file {
		display: none;
	}

	.form-error {
		margin: 0;
		color: #c4341f;
		font-size: 14px;
		font-weight: 400;
	}

	/* Helper text under a field: pulled up into .section's gap so it reads as
	   part of the field above. */
	.field-note {
		margin: -12px 0 0;
		color: #666;
		font-size: 14px;
		font-weight: 400;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.section__heading {
		color: #131927;
		font-size: 20px;
		font-weight: 500;
		line-height: normal;
		margin: 10px 0 -2px;
	}

	.section__hint {
		margin: -10px 0 0;
		color: #666;
		font-size: 14px;
		font-weight: 400;
		line-height: 1.4;
	}

	/* "Dashboard Image" / "Photo Gallery" — same weight as the form's field labels */
	.section__subtitle {
		color: #131927;
		font-size: 15px;
		font-weight: 500;
		line-height: normal;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 18px 20px;
	}

	.dashboard-image {
		width: 100%;
		aspect-ratio: 482 / 225;
		object-fit: cover;
		border-radius: 12px;
		border: 1px solid #d8d8d8;
		background: #e6e6e6;
		display: block;
	}

	.footer-actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
		margin-top: 14px;
	}

	/* --- Shared components, scaled down to the Create a Farm form --- */
	.edit-page :global(.field--lg) {
		gap: 6px;
	}

	.edit-page :global(.field--lg .label) {
		font-size: 15px;
		font-weight: 500;
	}

	.edit-page :global(.field--lg .input) {
		padding: 8px 16px;
		border-width: 1px;
		border-color: #d8d8d8;
		border-radius: 8px;
		font-family: inherit;
		font-size: 14px;
		color: #131927;
	}

	.edit-page :global(.field--lg .readonly-value) {
		font-family: inherit;
		font-size: 14px;
	}

	.edit-page :global(.choice-group) {
		gap: 10px;
	}

	.edit-page :global(.choice-group__label) {
		margin-bottom: 4px;
		font-size: 15px;
		font-weight: 500;
	}

	.edit-page :global(.choice) {
		gap: 10px;
		font-size: 15px;
	}

	.edit-page :global(.choice span) {
		font-size: 15px;
		font-weight: 400;
	}

	.edit-page :global(.choice input) {
		width: 16px;
		height: 16px;
		background-size: 16px 16px;
	}

	.edit-page :global(.upload-zone) {
		gap: 6px;
		padding: 24px 16px 18px;
	}

	.edit-page :global(.upload-zone__icon) {
		width: 44px;
		height: 44px;
	}

	.edit-page :global(.upload-zone__icon svg) {
		width: 22px;
		height: 22px;
	}

	.edit-page :global(.upload-zone__title) {
		font-size: 16px;
		line-height: 24px;
	}

	.edit-page :global(.upload-zone__hint),
	.edit-page :global(.upload-zone__error) {
		font-size: 12px;
	}

	.edit-page :global(.upload-zone__error) {
		margin-top: -10px;
	}

	.edit-page :global(.action-btn--block) {
		height: 44px;
		font-size: 15px;
	}

	.delete-farm-btn {
		height: 44px;
		border: 1px solid #c4341f;
		border-radius: 8px;
		background: #fff;
		color: #c4341f;
		font-family: inherit;
		font-size: 15px;
		font-weight: 500;
		cursor: pointer;
	}

	.delete-farm-btn:hover {
		background: #fcefec;
	}

	.deletion-pending {
		margin: 0;
		padding: 12px 16px;
		border-radius: 8px;
		background: #eceef2;
		color: #4f545e;
		font-size: 14px;
		text-align: center;
	}

	.delete-confirm {
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: 480px;
		max-width: 100%;
		padding: 28px 30px 24px;
		border-radius: 12px;
		background: #fff;
		box-shadow: 0 8px 30px rgba(20, 28, 16, 0.08);
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: #131927;
	}

	.delete-confirm__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		margin-bottom: 14px;
		border-radius: 50%;
		background: #fce4e1;
		color: #c4341f;
		font-size: 18px;
		font-weight: 700;
	}

	.delete-confirm__title {
		margin: 0;
		/* clear the Modal's close button */
		padding-right: 28px;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.25;
	}

	.delete-confirm__body {
		margin: 10px 0 0;
		color: #4f545e;
		font-size: 14px;
		line-height: 1.5;
	}

	.delete-confirm .form-error {
		margin-top: 12px;
	}

	.delete-confirm__actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 22px;
	}

	.delete-confirm__submit {
		height: 40px;
		padding: 8px 16px;
		border: none;
		border-radius: 8px;
		background: #c4341f;
		color: #fff;
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.delete-confirm__submit:hover:not(:disabled) {
		background: #a82b19;
	}

	.delete-confirm__submit:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	/* Requested-changes card */
	.edit-page :global(.card[role='alert']) {
		padding: 22px 24px 20px;
		border-radius: 12px;
	}

	.edit-page :global(.card[role='alert'] .icon) {
		width: 32px;
		height: 32px;
		margin-bottom: 12px;
		font-size: 18px;
	}

	.edit-page :global(.card[role='alert'] .title) {
		font-size: 20px;
	}

	.edit-page :global(.card[role='alert'] .divider) {
		margin: 16px 0;
	}

	.edit-page :global(.card[role='alert'] .heading) {
		margin-bottom: 10px;
		font-size: 15px;
	}

	.edit-page :global(.card[role='alert'] .reason) {
		padding: 14px 18px;
		border-radius: 8px;
		font-size: 14px;
	}

	.edit-page :global(.card[role='alert'] .note) {
		margin-top: 14px;
		font-size: 14px;
	}
</style>
