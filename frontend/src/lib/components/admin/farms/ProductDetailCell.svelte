<script lang="ts">
	import type { ProductLine } from '$lib/utils/admin-farms';

	interface Props {
		items: ProductLine[];
	}

	let { items }: Props = $props();

	let open = $state(false);
	let rootEl: HTMLDivElement | undefined = $state();
	let menuStyle = $state('');

	const categories = $derived(items.filter((item) => !item.unlabeled));
	const summary = $derived(
		categories.map((item) => item.category).join(', ') ||
			items.find((item) => item.unlabeled)?.detail ||
			''
	);
	const hasSharedDetails = $derived(items.some((item) => item.unlabeled));

	$effect(() => {
		if (!open || !rootEl) {
			menuStyle = '';
			return;
		}

		const place = () => {
			const rect = rootEl!.getBoundingClientRect();
			const width = 280;
			const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
			const estimatedHeight = Math.min(320, items.length * 56 + 16);
			const spaceBelow = window.innerHeight - rect.bottom;
			const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
			menuStyle = openUp
				? `bottom:${window.innerHeight - rect.top + 6}px;left:${left}px;width:${width}px;`
				: `top:${rect.bottom + 6}px;left:${left}px;width:${width}px;`;
		};
		place();

		const onPointerDown = (event: PointerEvent) => {
			if (!rootEl?.contains(event.target as Node | null)) open = false;
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') open = false;
		};
		window.addEventListener('resize', place);
		window.addEventListener('scroll', place, true);
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('resize', place);
			window.removeEventListener('scroll', place, true);
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

{#if items.length === 0}
	<span class="farms-table__text">—</span>
{:else}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="product-detail" bind:this={rootEl} onclick={(event) => event.stopPropagation()}>
		<button
			class="product-detail__trigger"
			type="button"
			aria-expanded={open}
			title={summary}
			onclick={() => (open = !open)}
		>
			<span class="product-detail__summary">{summary}</span>
			<img
				class="product-detail__chevron"
				class:product-detail__chevron--open={open}
				src="/images/map/chevronDownIcon.svg"
				alt=""
			/>
		</button>
		{#if open}
			<ul class="product-detail__menu" style={menuStyle}>
				{#each items as item (item.category)}
					<li>
						<span class="product-detail__category">{item.category}</span>
						{#if item.detail}
							<span class="product-detail__text">{item.detail}</span>
						{:else if !hasSharedDetails}
							<span class="product-detail__text">No details added</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.product-detail {
		position: relative;
		min-width: 0;
		width: 100%;
	}

	.product-detail__trigger {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.product-detail__summary {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.875rem;
	}

	.product-detail__chevron {
		width: 0.85rem;
		height: 0.85rem;
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.product-detail__chevron--open {
		transform: rotate(180deg);
	}

	.product-detail__menu {
		position: fixed;
		z-index: 30;
		margin: 0;
		padding: 0.35rem;
		list-style: none;
		border: 1px solid #d3d5de;
		border-radius: 0.5rem;
		background: #fff;
		box-shadow: 0 8px 20px rgba(19, 25, 39, 0.12);
	}

	.product-detail__menu li {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.45rem 0.6rem;
		border-radius: 0.375rem;
	}

	.product-detail__menu li:hover {
		background: #fafafa;
	}

	.product-detail__category {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #131927;
	}

	.product-detail__text {
		font-size: 0.8125rem;
		line-height: 1.35;
		color: #4f545e;
	}
</style>
