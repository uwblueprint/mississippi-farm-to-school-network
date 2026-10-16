<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';

	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { gqlClient } from '$lib/graphqlClient';
	import { ARCHIVE_FARM_MUTATION, DELETE_FARM_MUTATION } from '$lib/utils/pending-request-adapter';

	interface Props {
		farmId: string;
		farmName: string;
		/** id of the heading rendered by `children`, for aria-labelledby. */
		titleId: string;
		/** Path to return to after editing the farm. */
		returnTo: string;
		/** Where the farm is removed from, e.g. "the farms list" or "the pending queue". */
		removalContext: string;
		/** Shows the "more options" (Edit / Delete) menu. */
		showMenu?: boolean;
		/** Disables the "more options" menu button (e.g. while data is still loading). */
		menuDisabled?: boolean;
		/** Disables the close button. */
		closeDisabled?: boolean;
		/** Blocks closing via backdrop click or Escape (e.g. while a mutation is in flight). */
		blockClose?: boolean;
		/** Marks the dialog as busy while its content is still loading. */
		busy?: boolean;
		onClose: () => void;
		/** Called after the farm is archived or deleted so the parent can refresh its list. */
		onRemoved?: (farmId: string) => void;
		children: Snippet;
	}

	let {
		farmId,
		farmName,
		titleId,
		returnTo,
		removalContext,
		showMenu = true,
		menuDisabled = false,
		closeDisabled = false,
		blockClose = false,
		busy = false,
		onClose,
		onRemoved,
		children
	}: Props = $props();

	type RemovalAction = 'archive' | 'delete';

	const REMOVAL_COPY: Record<
		RemovalAction,
		{ title: string; label: string; pending: string; error: string; mutation: string }
	> = {
		archive: {
			title: 'Archive this farm?',
			label: 'Archive',
			pending: 'Archiving…',
			error: 'Failed to archive farm.',
			mutation: ARCHIVE_FARM_MUTATION
		},
		delete: {
			title: 'Delete this farm?',
			label: 'Delete',
			pending: 'Deleting…',
			error: 'Failed to delete farm.',
			mutation: DELETE_FARM_MUTATION
		}
	};

	let menuOpen = $state(false);
	let confirmAction = $state<RemovalAction | null>(null);
	let removing = $state(false);
	let removeError = $state<string | null>(null);
	let menuRoot = $state<HTMLDivElement | null>(null);

	// Body scroll lock + Escape.
	$effect(() => {
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== 'Escape' || blockClose || removing || confirmAction) return;
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
		if (blockClose || removing || confirmAction) return;
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

	function openConfirm(action: RemovalAction) {
		menuOpen = false;
		confirmAction = action;
	}

	async function handleConfirmRemoval(action: RemovalAction) {
		if (removing) return;
		removing = true;
		removeError = null;

		try {
			await gqlClient(REMOVAL_COPY[action].mutation, { id: farmId });
			confirmAction = null;
			onRemoved?.(farmId);
			onClose();
		} catch (error) {
			confirmAction = null;
			removeError = error instanceof Error ? error.message : REMOVAL_COPY[action].error;
		} finally {
			removing = false;
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
			{#if showMenu}
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
									class="farm-request-modal__menu-item"
									role="menuitem"
									onclick={() => openConfirm('archive')}
								>
									Archive
								</button>
							</li>
							<li role="presentation">
								<button
									type="button"
									class="farm-request-modal__menu-item farm-request-modal__menu-item--danger"
									role="menuitem"
									onclick={() => openConfirm('delete')}
								>
									Delete
								</button>
							</li>
						</ul>
					{/if}
				</div>
			{/if}

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

		{#if removeError}
			<p class="review-application-card__error">{removeError}</p>
		{/if}

		{@render children()}
	</div>
</div>

{#if confirmAction}
	{@const action = confirmAction}
	{@const copy = REMOVAL_COPY[action]}
	<ConfirmDialog
		title={copy.title}
		confirmLabel={removing ? copy.pending : copy.label}
		tone={action === 'delete' ? 'danger' : 'primary'}
		onconfirm={() => void handleConfirmRemoval(action)}
		oncancel={() => {
			if (!removing) confirmAction = null;
		}}
	>
		{#snippet body()}
			{#if action === 'archive'}
				This will hide <strong>{farmName}</strong> from the Farm Fresh Map and {removalContext}, and
				stop its owner from editing it. You can unarchive it later from Deleted & Archived Farms.
			{:else}
				This will remove <strong>{farmName}</strong> from the Farm Fresh Map and {removalContext}.
				You can restore it later from Deleted & Archived Farms.
			{/if}
		{/snippet}
	</ConfirmDialog>
{/if}
