<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { ARCHIVE_FARM_MUTATION } from '$lib/utils/pending-request-adapter';

	interface Props {
		farmId: string;
		farmName: string;
		/** id of the heading rendered by `children`, for aria-labelledby. */
		titleId: string;
		/** Path to return to after editing the farm. */
		returnTo: string;
		/** Where the farm is removed from, e.g. "the farms list" or "the pending queue". */
		removalContext: string;
		/** Disables the "more options" menu button (e.g. while data is still loading). */
		menuDisabled?: boolean;
		/** Disables the close button. */
		closeDisabled?: boolean;
		/** Blocks closing via backdrop click or Escape (e.g. while a mutation is in flight). */
		blockClose?: boolean;
		/** Marks the dialog as busy while its content is still loading. */
		busy?: boolean;
		onClose: () => void;
		/** Called after the farm is archived so the parent can refresh its list. */
		onArchived?: (farmId: string) => void;
		children: Snippet;
	}

	let {
		farmId,
		farmName,
		titleId,
		returnTo,
		removalContext,
		menuDisabled = false,
		closeDisabled = false,
		blockClose = false,
		busy = false,
		onClose,
		onArchived,
		children
	}: Props = $props();

	let menuOpen = $state(false);
	let confirmDeleteOpen = $state(false);
	let archiving = $state(false);
	let archiveError = $state<string | null>(null);
	let menuRoot = $state<HTMLDivElement | null>(null);

	// Body scroll lock + Escape.
	$effect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== 'Escape' || blockClose || archiving || confirmDeleteOpen) return;
			if (menuOpen) {
				menuOpen = false;
				return;
			}
			onClose();
		}

		window.addEventListener('keydown', onKeydown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener('keydown', onKeydown);
		};
	});

	function handleBackdropClick(event: MouseEvent) {
		if (blockClose || archiving || confirmDeleteOpen) return;
		if (event.target === event.currentTarget) onClose();
	}

	function handleWindowClick(event: MouseEvent) {
		if (!menuOpen || !menuRoot) return;
		if (!menuRoot.contains(event.target as Node)) {
			menuOpen = false;
		}
	}

	function toggleMenu(event: MouseEvent) {
		event.stopPropagation();
		if (menuDisabled) return;
		menuOpen = !menuOpen;
	}

	function handleEdit() {
		menuOpen = false;
		void goto(`/farmer/farms/${farmId}/edit?returnTo=${encodeURIComponent(returnTo)}`);
	}

	function handleDeleteClick() {
		menuOpen = false;
		confirmDeleteOpen = true;
	}

	async function handleConfirmDelete() {
		if (archiving) return;
		archiving = true;
		archiveError = null;

		try {
			await gqlClient(ARCHIVE_FARM_MUTATION, { id: farmId });
			confirmDeleteOpen = false;
			onArchived?.(farmId);
			onClose();
		} catch (error) {
			confirmDeleteOpen = false;
			archiveError = error instanceof Error ? error.message : 'Failed to delete farm.';
		} finally {
			archiving = false;
		}
	}
</script>

<svelte:window onclick={handleWindowClick} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="farm-request-overlay" role="presentation" onclick={handleBackdropClick}>
	<div
		class="farm-request-modal"
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
		aria-busy={busy}
	>
		<div class="farm-request-modal__toolbar">
			<div class="farm-request-modal__menu-wrap" bind:this={menuRoot}>
				<button
					type="button"
					class="farm-request-modal__icon-btn farm-request-modal__icon-btn--dots"
					aria-label="More options"
					aria-expanded={menuOpen}
					aria-haspopup="menu"
					disabled={menuDisabled}
					onclick={toggleMenu}
				>
					<img src="/images/admin/dotsVerticalIcon.svg" alt="" />
				</button>

				{#if menuOpen}
					<ul class="farm-request-modal__menu" role="menu" aria-label="Farm actions">
						<li role="presentation">
							<button
								type="button"
								class="farm-request-modal__menu-item"
								role="menuitem"
								onclick={handleEdit}
							>
								Edit
							</button>
						</li>
						<li role="presentation">
							<button
								type="button"
								class="farm-request-modal__menu-item farm-request-modal__menu-item--danger"
								role="menuitem"
								onclick={handleDeleteClick}
							>
								Delete
							</button>
						</li>
					</ul>
				{/if}
			</div>

			<button
				type="button"
				class="farm-request-modal__icon-btn farm-request-modal__icon-btn--close"
				aria-label="Close"
				disabled={closeDisabled}
				onclick={onClose}
			>
				<img src="/images/admin/closeIcon.svg" alt="" />
			</button>
		</div>

		{#if archiveError}
			<p class="review-application-card__error">{archiveError}</p>
		{/if}

		{@render children()}
	</div>
</div>

{#if confirmDeleteOpen}
	<ConfirmDialog
		title="Delete this farm?"
		confirmLabel={archiving ? 'Deleting…' : 'Delete'}
		tone="danger"
		onconfirm={() => void handleConfirmDelete()}
		oncancel={() => {
			if (!archiving) confirmDeleteOpen = false;
		}}
	>
		{#snippet body()}
			This will archive <strong>{farmName}</strong> and remove it from {removalContext}. You can
			restore it later from archived farms.
		{/snippet}
	</ConfirmDialog>
{/if}
