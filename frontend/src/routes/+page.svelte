<script lang="ts">
	import { Switch, FileUpload, Progress } from '@skeletonlabs/skeleton-svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let name = $state('');
	let email = $state('');
	let category = $state('general');
	let message = $state('');
	let subscribe = $state(true);
	let priority = $state('normal');
	let acceptedFiles = $state<File[]>([]);

	function handleSubmit() {
		console.log({ name, email, category, message, subscribe, priority, acceptedFiles });
	}

	function formatSize(bytes: number) {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="min-h-screen bg-surface-50-950 p-6 md:p-10">
	<div class="mx-auto max-w-4xl space-y-12">
		<header class="space-y-2">
			<h1 class="text-3xl font-bold text-surface-950-50">Skeleton UI Components</h1>
			<p class="text-surface-600-400">
				Demo page: Skeleton Tailwind classes plus Svelte components (Switch, FileUpload, Progress).
			</p>
		</header>

		<!-- Buttons -->
		<Card class="preset-outlined-surface-200-800 p-6">
			<h2 class="mb-4 text-xl font-semibold text-surface-950-50">Buttons</h2>
			<div class="flex flex-wrap gap-3">
				<Button class="preset-filled-primary-500">Primary</Button>
				<Button class="preset-filled-secondary-500">Secondary</Button>
				<Button class="preset-filled-surface-500">Neutral</Button>
				<Button class="preset-tonal-primary">Tonal Primary</Button>
				<Button class="preset-tonal-secondary">Tonal Secondary</Button>
				<Button class="preset-outlined-primary-500">Outlined Primary</Button>
				<Button class="preset-outlined-surface-300-700">Outlined Neutral</Button>
			</div>
			<div class="mt-3 flex flex-wrap items-center gap-3">
				<Button class="preset-filled-primary-500 btn-sm">Small</Button>
				<Button class="preset-filled-primary-500 btn-base">Base</Button>
				<Button class="preset-filled-primary-500 btn-lg">Large</Button>
			</div>
		</Card>

		<!-- Cards -->
		<section class="space-y-4">
			<h2 class="text-xl font-semibold text-surface-950-50">Cards</h2>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card class="preset-filled-primary-500 p-4 text-primary-contrast-500">
					<p class="font-medium">Filled primary card</p>
					<p class="text-sm opacity-90">Uses preset-filled-primary-500</p>
				</Card>
				<Card class="preset-tonal-secondary p-4">
					<p class="font-medium text-surface-950-50">Tonal secondary</p>
					<p class="text-sm text-surface-600-400">preset-tonal-secondary</p>
				</Card>
				<Card class="preset-outlined-surface-200-800 p-4">
					<p class="font-medium text-surface-950-50">Outlined neutral</p>
					<p class="text-sm text-surface-600-400">preset-outlined-surface-200-800</p>
				</Card>
			</div>
		</section>

		<!-- Form: Switch + FileUpload are Skeleton Svelte components -->
		<Card class="preset-outlined-surface-200-800 p-6">
			<h2 class="mb-6 text-xl font-semibold text-surface-950-50">
				Form (Switch &amp; FileUpload components)
			</h2>
			<form
				class="w-full max-w-xl space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<fieldset class="space-y-4">
					<label class="label block">
						<span class="label-text">Name</span>
						<input class="input w-full" type="text" placeholder="Your name" bind:value={name} />
					</label>
					<label class="label block">
						<span class="label-text">Email</span>
						<input
							class="input w-full"
							type="email"
							placeholder="you@example.com"
							bind:value={email}
						/>
					</label>
					<label class="label block">
						<span class="label-text">Category</span>
						<select class="select w-full" bind:value={category}>
							<option value="general">General</option>
							<option value="support">Support</option>
							<option value="feedback">Feedback</option>
						</select>
					</label>
					<label class="label block">
						<span class="label-text">Message</span>
						<textarea
							class="textarea w-full rounded-container"
							rows="4"
							placeholder="Your message..."
							bind:value={message}
						></textarea>
					</label>
					<div class="flex items-center justify-between gap-2 rounded-container p-2">
						<Switch checked={subscribe} onCheckedChange={(d) => (subscribe = d.checked)}>
							<Switch.Label class="text-surface-950-50">Subscribe to updates</Switch.Label>
							<Switch.Control
								class="preset-filled-surface-200-800 data-[state=checked]:preset-filled-primary-500"
							>
								<Switch.Thumb />
							</Switch.Control>
							<Switch.HiddenInput />
						</Switch>
					</div>
					<div class="space-y-2">
						<span class="label-text block">Priority</span>
						<div class="flex flex-wrap gap-4">
							<label class="flex items-center gap-2">
								<input
									class="radio"
									type="radio"
									name="priority"
									value="low"
									bind:group={priority}
								/>
								<span class="text-surface-950-50">Low</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									class="radio"
									type="radio"
									name="priority"
									value="normal"
									bind:group={priority}
								/>
								<span class="text-surface-950-50">Normal</span>
							</label>
							<label class="flex items-center gap-2">
								<input
									class="radio"
									type="radio"
									name="priority"
									value="high"
									bind:group={priority}
								/>
								<span class="text-surface-950-50">High</span>
							</label>
						</div>
					</div>
					<div class="label block">
						<span class="label-text">Images</span>
						<FileUpload
							accept="image/*"
							maxFiles={10}
							{acceptedFiles}
							onFileChange={(d) => (acceptedFiles = d.acceptedFiles)}
							class="w-full"
						>
							<FileUpload.Label class="sr-only">Upload images</FileUpload.Label>
							<FileUpload.Dropzone
								class="flex min-h-24 flex-col items-center justify-center gap-2 rounded-container border-2 border-dashed border-surface-300-700 bg-surface-100-900 p-4"
							>
								<span class="text-surface-600-400">Select images or drag here.</span>
								<FileUpload.Trigger class="btn preset-filled-primary-500">
									Browse images
								</FileUpload.Trigger>
								<FileUpload.HiddenInput />
							</FileUpload.Dropzone>
							<FileUpload.ItemGroup class="mt-3 flex flex-wrap gap-2">
								<FileUpload.Context>
									{#snippet children(fileUpload)}
										{#each fileUpload().acceptedFiles as file (file.name + file.size)}
											<FileUpload.Item
												{file}
												class="flex items-center gap-2 rounded-container preset-outlined-surface-200-800 px-3 py-2"
											>
												<FileUpload.ItemName class="text-sm text-surface-950-50" />
												<FileUpload.ItemSizeText class="text-xs text-surface-600-400">
													{formatSize(file.size)}
												</FileUpload.ItemSizeText>
												<FileUpload.ItemDeleteTrigger
													class="ml-1 btn preset-tonal-error btn-sm"
													aria-label="Remove file"
												>
													×
												</FileUpload.ItemDeleteTrigger>
											</FileUpload.Item>
										{/each}
									{/snippet}
								</FileUpload.Context>
							</FileUpload.ItemGroup>
							<FileUpload.Context>
								{#snippet children(fu)}
									{#if fu().acceptedFiles.length > 0}
										<FileUpload.ClearTrigger
											class="mt-2 btn preset-outlined-surface-300-700 btn-sm"
										>
											Clear all
										</FileUpload.ClearTrigger>
									{/if}
								{/snippet}
							</FileUpload.Context>
						</FileUpload>
					</div>
				</fieldset>
				<fieldset class="flex justify-end gap-3 pt-2">
					<Button type="button" class="preset-outlined-surface-300-700">Cancel</Button>
					<Button type="submit" class="preset-filled-primary-500">Submit</Button>
				</fieldset>
			</form>
		</Card>

		<!-- Progress (Skeleton component) -->
		<Card class="preset-outlined-surface-200-800 p-6">
			<h2 class="mb-4 text-xl font-semibold text-surface-950-50">Progress</h2>
			<div class="space-y-4">
				<Progress value={65} max={100} class="w-full max-w-xs">
					<Progress.Label class="label-text text-surface-950-50"
						>Upload progress (65%)</Progress.Label
					>
					<Progress.Track class="h-2 w-full overflow-hidden rounded-full bg-surface-200-800">
						<Progress.Range
							class="h-full rounded-full bg-primary-500 transition-all duration-300"
							style="width: 65%"
						/>
					</Progress.Track>
				</Progress>
			</div>
		</Card>

		<!-- Badges -->
		<Card class="preset-outlined-surface-200-800 p-6">
			<h2 class="mb-4 text-xl font-semibold text-surface-950-50">Badges</h2>
			<div class="flex flex-wrap gap-2">
				<Badge class="preset-filled-primary-500">Primary</Badge>
				<Badge class="preset-filled-secondary-500">Secondary</Badge>
				<Badge class="preset-tonal-success">Success</Badge>
				<Badge class="preset-tonal-warning">Warning</Badge>
				<Badge class="preset-tonal-error">Error</Badge>
				<Badge class="preset-outlined-surface-300-700">Neutral</Badge>
			</div>
		</Card>
	</div>
</div>
