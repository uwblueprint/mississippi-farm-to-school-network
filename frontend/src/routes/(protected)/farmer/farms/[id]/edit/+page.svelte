<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import TextInput from '$lib/components/TextInput.svelte';
	import ChoiceGroup from '$lib/components/ChoiceGroup.svelte';
	import UploadZone from '$lib/components/UploadZone.svelte';
	import PhotoGallery from '$lib/components/PhotoGallery.svelte';
	import RequestedChangesCard from '$lib/components/RequestedChangesCard.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { IMAGE_ACCEPT, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '$lib/fileDrop';
	import { formModelToUpdateInput } from '$lib/farmMapping';
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
	const farmId = $derived($page.params.id);

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
	const UPLOAD_FARM_IMAGE = `
		mutation UploadFarmImage($farmId: String!, $originalFileName: String!, $contentType: String!, $dataBase64: String!) {
			uploadFarmImage(farmId: $farmId, originalFileName: $originalFileName, contentType: $contentType, dataBase64: $dataBase64) {
				fileId
				url
				originalFileName
			}
		}
	`;
	const DELETE_FILE = `
		mutation DeleteFile($fileId: String!) {
			deleteFile(fileId: $fileId)
		}
	`;

	// Encode file bytes as raw base64 (no data: prefix) for uploadFarmImage.
	function toBase64(bytes: Uint8Array): string {
		let binary = '';
		const chunk = 0x8000;
		for (let i = 0; i < bytes.length; i += chunk) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
		}
		return btoa(binary);
	}

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
	// carousel_photos (stored_files ids) + filesByFarm. Derived from `data`
	// rather than copied into `farm` so they track uploads/removals across
	// invalidateAll(). Writes are based on the PERSISTED ids (coverId/galleryIds),
	// not the display subset, so a transiently unresolvable file is never evicted.
	const galleryPhotos = $derived(data.gallery.map((img) => ({ id: img.fileId, url: img.url })));
	const galleryIds = $derived(data.galleryIds);
	const coverId = $derived(data.coverId);
	const dashboardImageName = $derived(data.cover?.originalFileName ?? '');

	const MAX_GALLERY_PHOTOS = 10;

	let saving = $state(false);
	let uploading = $state(false);
	let actionError = $state('');
	let galleryInput = $state<HTMLInputElement | null>(null);

	// Persist the clean editable fields. REJECTED farms resubmit (re-enters the
	// approval queue); all others use updateFarm.
	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		saving = true;
		actionError = '';
		try {
			const input = formModelToUpdateInput(farm);
			const mutation = data.status === 'REJECTED' ? RESUBMIT_FARM : UPDATE_FARM;
			await gqlClient(mutation, { id: farmId, input });
			// Refresh status/rejection; the loader re-runs but the user's edits stay.
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Save failed.';
		} finally {
			saving = false;
		}
	}

	// Persist a bucket assignment (cover_photo / carousel_photos hold
	// stored_files ids). Sent separately from the main Save so image edits are
	// immediate and never clobber unsaved field edits. ALWAYS writes both
	// columns from the current state (+ the change), so the first edit of a
	// legacy farm (files but empty columns) persists the displayed split
	// instead of losing the other bucket.
	async function assignImages(next: { cover?: string | null; gallery?: string[] }) {
		const cover = next.cover !== undefined ? next.cover : coverId;
		const input: { cover_photo?: string; carousel_photos: string[] } = {
			carousel_photos: next.gallery ?? galleryIds
		};
		if (cover) input.cover_photo = cover;
		await gqlClient(UPDATE_FARM, { id: farmId, input });
	}

	// Upload each valid file to the farm's file pool and return the new
	// stored_files ids. filesFromDrop caps the drop path; the file pickers reach
	// here unfiltered, so re-apply the same limit for every upload surface.
	async function uploadStoredFiles(files: File[]): Promise<string[]> {
		const valid = files.filter((file) => file.size <= MAX_UPLOAD_BYTES);
		const oversized = files.length - valid.length;
		if (valid.length === 0) {
			actionError = `Images must be under ${MAX_UPLOAD_LABEL}.`;
			return [];
		}
		actionError =
			oversized > 0 ? `Some files were skipped — images must be under ${MAX_UPLOAD_LABEL}.` : '';

		const fileIds: string[] = [];
		for (const file of valid) {
			const dataBase64 = toBase64(new Uint8Array(await file.arrayBuffer()));
			const res = await gqlClient<{ uploadFarmImage: { fileId: string } }>(UPLOAD_FARM_IMAGE, {
				farmId,
				originalFileName: file.name,
				contentType: file.type || 'application/octet-stream',
				dataBase64
			});
			fileIds.push(res.uploadFarmImage.fileId);
		}
		return fileIds;
	}

	// Dashboard Image bucket: exactly one file becomes the cover (the zone is
	// multiple={false}; the slice guards the programmatic path). The replaced
	// cover file is deleted best-effort so it doesn't linger as an orphan.
	async function handleCoverFiles(files: FileList | null) {
		if (!files || files.length === 0 || uploading) return;
		uploading = true;
		try {
			const previousCoverId = coverId;
			const [fileId] = await uploadStoredFiles(Array.from(files).slice(0, 1));
			if (fileId) {
				await assignImages({ cover: fileId });
				if (
					previousCoverId &&
					previousCoverId !== fileId &&
					!galleryIds.includes(previousCoverId)
				) {
					try {
						await gqlClient(DELETE_FILE, { fileId: previousCoverId });
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
			const fileIds = await uploadStoredFiles(Array.from(files).slice(0, remaining));
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
			await gqlClient(DELETE_FILE, { fileId });
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Remove failed.';
		} finally {
			await invalidateAll();
			uploading = false;
		}
	}

	function deleteFarm() {
		// TODO(backend): delete deferred out of scope — stub kept as-is.
		console.log('delete farm', farmId);
	}
</script>

<svelte:head>
	<title>Edit farm</title>
</svelte:head>

{#snippet actionBar()}
	<div class="action-bar">
		<ActionButton variant="outline" href="/farmer/farms">
			{#snippet iconLeft()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
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

		<ActionButton variant="primary" type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save'}
			{#snippet iconRight()}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
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
			hint="JPG or PNG"
			multiple={false}
			onFiles={handleCoverFiles}
			disabled={uploading}
		/>
		{#if dashboardImageName}
			<span class="file-link">{dashboardImageName}</span>
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
			hint="JPG or PNG, up to 10 pics"
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
		<ActionButton variant="primary" type="submit" block disabled={saving}
			>{saving ? 'Saving…' : 'Save'}</ActionButton
		>
		<ActionButton variant="danger" onclick={deleteFarm}>Delete Farm</ActionButton>
	</div>

	{@render actionBar()}
</form>

<style>
	.edit-page {
		padding: 72px clamp(32px, 8cqi, 110px);
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		max-width: 1400px;
		margin: 0 auto;
		box-sizing: border-box;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		color: #131927;
	}

	.action-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
	}

	/* Back/Save ↔ main content: 70px total (28px flex gap + 42px) */
	.edit-page > .action-bar:first-child {
		margin-bottom: 42px;
	}

	.edit-page > .action-bar:last-child {
		margin-top: 42px;
	}

	.edit-title {
		font-family: 'Figtree Variable', 'Figtree', sans-serif;
		font-size: 32px;
		font-weight: 500;
		line-height: normal;
		color: #000;
	}

	/* Hidden file input driving the public gallery "Add Photos" tile. */
	.visually-hidden-file {
		display: none;
	}

	.form-error {
		margin: 0;
		color: #c4341f;
		font-size: 17px;
		font-weight: 400;
	}

	/* Helper text under a field. Sits inside .section's 38px flex gap, so pull it
	   back up to read as part of the field above rather than a separate row. */
	.field-note {
		margin: -28px 0 0;
		color: #858790;
		font-size: 14px;
		font-weight: 400;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 38px;
	}

	.section__heading {
		color: #000;
		font-size: 24px;
		font-weight: 400;
		line-height: 34px;
		margin: 12px 0 4px;
	}

	.section__hint {
		color: #000;
		font-size: 21px;
		font-weight: 300;
		margin: 0;
	}

	/* Section subtitle (e.g. "Photo Gallery", "Dashboard Image") — H2 headline */
	.section__subtitle {
		color: #000;
		font-size: 24px;
		font-weight: 400;
		line-height: 34px;
	}

	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 38px;
	}

	.file-link {
		color: #3742b4;
		font-family: 'DM Sans Variable', 'DM Sans', sans-serif;
		font-size: 21px;
		font-weight: 300;
		line-height: normal;
		text-decoration-line: underline;
		text-decoration-style: solid;
		text-decoration-skip-ink: auto;
		text-underline-position: from-font;
		width: fit-content;
	}

	.footer-actions {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 48px;
		/* end of questions ↔ Save: 48px total (28px flex gap + 20px) */
		margin-top: 20px;
	}
</style>
