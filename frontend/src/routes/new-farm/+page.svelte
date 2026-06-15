<script lang="ts">
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';
	import { COUNTIES } from '$lib/data/msCounties';

	let { data } = $props();

	let phone = $state(data.user?.phone ?? '');
	let email = $state(data.user?.email ?? '');

	let selectedCounties = $state<string[]>([]);

	// Image files the farmer selects for this farm, kept in the form's reactive state.
	let selectedFiles = $state<File[]>([]);

	function handleFileChange(details: { acceptedFiles: File[] }) {
		selectedFiles = details.acceptedFiles;
		// Verify files are being captured correctly.
		console.log('selectedFiles', selectedFiles);
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="container">
	<h1>Farm Information</h1>

	<div class="form-group">
		<label>Farm ID#</label>
		<input />
	</div>

	<div class="form-group">
		<label>Farm Name</label>
		<input />
	</div>

	<div class="form-group">
		<label>Farm address</label>
		<textarea rows="3"></textarea>
	</div>

	<div class="form-group">
		<label>Counties and/or Cities Served</label>

		<select multiple bind:value={selectedCounties}>
			{#each COUNTIES as county}
				<option value={county}>{county}</option>
			{/each}
		</select>
	</div>

	<div class="form-group">
		<label>Farmer/Owner Name</label>
		<input value={`${data.user?.firstName ?? ''} ${data.user?.lastName ?? ''}`} disabled />
	</div>

	<h2>Primary Contact Information</h2>

	<div class="row">
		<div class="form-group">
			<label>Phone Number</label>
			<input bind:value={phone} />
		</div>

		<div class="form-group">
			<label>Email Address</label>
			<input bind:value={email} />
		</div>
	</div>

	<div class="row">
		<div class="form-group">
			<label>Social Media</label>
			<input />
		</div>

		<div class="form-group">
			<label>Farm Address</label>
			<input />
		</div>
	</div>

	<div class="form-group">
		<label>Growing Practices</label>

		<div class="choice-group">
			{#each ['Option 1', 'Option 1', 'Option 1', 'Option 1', 'Option 1'] as option}
				<label class="checkbox-choice">
					<input type="checkbox" />
					<span>{option}</span>
				</label>
			{/each}
		</div>
	</div>

	<div class="form-group">
		<label>What produce/products do you offer seasonally?</label>
		<textarea rows="4"></textarea>
	</div>

	<div class="form-group">
		<label>Does your farm identify as BIPOC-owned?</label>

		<div class="choice-group">
			<label class="radio-choice">
				<input type="radio" name="bipoc" value="yes" />
				<span>Yes</span>
			</label>

			<label class="radio-choice">
				<input type="radio" name="bipoc" value="no" />
				<span>No</span>
			</label>
		</div>
	</div>

	<div class="form-group">
		<label>Are you GAP/GHP Certified?</label>

		<div class="choice-group">
			<label class="radio-choice">
				<input type="radio" name="gap" value="yes" />
				<span>Yes</span>
			</label>

			<label class="radio-choice">
				<input type="radio" name="gap" value="no" />
				<span>No</span>
			</label>
		</div>
	</div>

	<div class="form-group">
		<label> Do you offer agritourism opportunities or field trips? If yes, please describe. </label>
		<textarea rows="4"></textarea>
	</div>

	<div class="form-group">
		<label>
			*Optional: Upload photos of your farm, operations, and/or products here. (Optional)
		</label>

		<FileUpload
			accept="image/*"
			maxFiles={10}
			acceptedFiles={selectedFiles}
			onFileChange={handleFileChange}
		>
			<FileUpload.Label class="sr-only">Upload farm images</FileUpload.Label>
			<FileUpload.Dropzone
				class="flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#bdbdbd] bg-[#dcdcdc] p-4 text-[#444]"
			>
				<span class="text-sm">Select images or drag them here</span>
				<FileUpload.Trigger
					class="rounded-md border-none bg-[#5f5f5f] px-4 py-2 text-sm text-white"
				>
					Upload
				</FileUpload.Trigger>
				<FileUpload.HiddenInput />
			</FileUpload.Dropzone>
		</FileUpload>

		{#if selectedFiles.length > 0}
			<ul class="file-list">
				{#each selectedFiles as file (file.name + file.size)}
					<li>
						<span class="file-name">{file.name}</span>
						<span class="file-size">{formatSize(file.size)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="form-group center submit-section">
		<button class="submit">Submit Farm Information</button>
		<p class="back">← Back to Onboarding</p>
	</div>
</div>

<style>
	.container {
		font-family: 'DM Sans', sans-serif;
		font-weight: 300;
		max-width: 900px;
		margin: 0 auto;
		padding: 40px 20px;
		color: #111;
	}

	h1 {
		font-size: 28px;
		font-weight: 400;
		margin-bottom: 24px;
	}

	h2 {
		font-size: 20px;
		font-weight: 400;
		margin: 32px 0 16px;
	}

	.form-group {
		margin-bottom: 20px;
		display: flex;
		flex-direction: column;
	}

	label {
		font-size: 14px;
		margin-bottom: 6px;
		color: #333;
	}

	input,
	textarea,
	select {
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #dcdcdc;
		background: #f8f8f8;
		font-size: 14px;
		font-family: inherit;
	}

	input:disabled {
		background: #eee;
		color: #666;
	}

	.row {
		display: flex;
		gap: 20px;
	}

	.row .form-group {
		flex: 1;
	}

	.choice-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 6px;
	}

	.checkbox-choice,
	.radio-choice {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 10px;
		width: fit-content;
		white-space: nowrap;
		margin-bottom: 0;
		font-size: 14px;
	}

	.checkbox-choice input,
	.radio-choice input {
		appearance: none;
		-webkit-appearance: none;
		margin: 0;
		padding: 0;
		width: 16px;
		height: 16px;
		background: #bdbdbd;
		border: none;
		cursor: pointer;
	}

	.checkbox-choice input {
		border-radius: 0;
	}

	.radio-choice input {
		border-radius: 50%;
	}

	select[multiple] {
		min-height: 140px;
	}

	.file-list {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.file-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 8px 12px;
		border: 1px solid #dcdcdc;
		border-radius: 6px;
		background: #f8f8f8;
		font-size: 14px;
	}

	.file-size {
		color: #666;
		font-size: 12px;
	}

	.submit {
		background: #5f5f5f;
		color: white;
		padding: 14px 24px;
		border-radius: 8px;
		border: none;
		width: 320px;
	}

	.center {
		align-items: center;
	}

	.back {
		margin-top: 10px;
		font-size: 14px;
		color: #444;
	}

	.submit-section {
		padding-top: 40px;
		padding-bottom: 40px;
	}

	.submit {
		margin-bottom: 24px;
	}
</style>
