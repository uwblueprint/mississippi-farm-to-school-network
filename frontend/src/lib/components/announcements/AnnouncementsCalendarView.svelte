<script lang="ts">
	import type { Announcement, AnnouncementStatus } from '$lib/types/announcement';
	import { parseDate, statusOf } from '$lib/utils/announcement-dates';
	import { stripHtml } from '$lib/utils/rich-text';
	import AnnouncementCard from './AnnouncementCard.svelte';
	import chevronLeftIcon from '$lib/assets/announcements/chevron-left.svg';
	import chevronRightIcon from '$lib/assets/announcements/chevron-right.svg';

	const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
	const DAY_MS = 86_400_000;
	const BAR_TOP = 40;
	const BAR_STRIDE = 29;

	type Segment = {
		announcement: Announcement;
		status: AnnouncementStatus;
		startCol: number;
		span: number;
		lane: number;
	};

	type Week = {
		days: Date[];
		segments: Segment[];
		laneCount: number;
	};

	let { announcements }: { announcements: Announcement[] } = $props();

	const now = new Date();
	let monthCursor = $state(new Date(now.getFullYear(), now.getMonth(), 1));
	let popup = $state<{ announcement: Announcement; top: number; left: number } | null>(null);
	let wrapperEl: HTMLDivElement | undefined = $state();
	let popupEl: HTMLDivElement | undefined = $state();

	const monthLabel = $derived(
		monthCursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	const weeks = $derived.by(() => {
		const first = monthCursor;
		const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
		const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
		const gridEnd = new Date(
			last.getFullYear(),
			last.getMonth(),
			last.getDate() + 6 - last.getDay()
		);

		const result: Week[] = [];
		for (
			let cursor = new Date(gridStart);
			cursor <= gridEnd;
			cursor.setDate(cursor.getDate() + 7)
		) {
			const days = Array.from(
				{ length: 7 },
				(_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i)
			);
			result.push({ days, segments: [], laneCount: 0 });
		}

		const sorted = [...announcements].sort(
			(a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate)
		);

		for (const week of result) {
			const weekStart = week.days[0].getTime();
			const weekEnd = week.days[6].getTime();
			const lanes: { startCol: number; endCol: number }[][] = [];

			for (const announcement of sorted) {
				const start = parseDate(announcement.startDate).getTime();
				const end = announcement.endDate ? parseDate(announcement.endDate).getTime() : Infinity;
				if (end < weekStart || start > weekEnd) continue;

				const startCol = start <= weekStart ? 0 : Math.round((start - weekStart) / DAY_MS);
				const endCol = end >= weekEnd ? 6 : Math.round((end - weekStart) / DAY_MS);

				let lane = lanes.findIndex((occupied) =>
					occupied.every((seg) => seg.endCol < startCol || seg.startCol > endCol)
				);
				if (lane === -1) {
					lane = lanes.length;
					lanes.push([]);
				}
				lanes[lane].push({ startCol, endCol });

				week.segments.push({
					announcement,
					status: statusOf(announcement),
					startCol,
					span: endCol - startCol + 1,
					lane
				});
			}

			week.laneCount = lanes.length;
		}

		return result;
	});

	function shiftMonth(delta: number) {
		monthCursor = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
		popup = null;
	}

	function goToToday() {
		monthCursor = new Date(now.getFullYear(), now.getMonth(), 1);
		popup = null;
	}

	function openPopup(event: MouseEvent, announcement: Announcement) {
		if (!wrapperEl) return;
		const barRect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const wrapperRect = wrapperEl.getBoundingClientRect();
		const width = Math.min(521, wrapperRect.width);
		const left = Math.min(Math.max(barRect.left - wrapperRect.left, 0), wrapperRect.width - width);
		const top = barRect.bottom - wrapperRect.top + 8;
		popup = { announcement, top, left };
	}

	$effect(() => {
		if (!popup) return;
		const onPointerDown = (event: PointerEvent) => {
			if (!popupEl?.contains(event.target as Node | null)) {
				popup = null;
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') popup = null;
		};
		document.addEventListener('pointerdown', onPointerDown);
		document.addEventListener('keydown', onKeyDown);
		return () => {
			document.removeEventListener('pointerdown', onPointerDown);
			document.removeEventListener('keydown', onKeyDown);
		};
	});
</script>

<div class="calendar-view">
	<div class="month-header">
		<h2 class="month-title">{monthLabel}</h2>
		<div class="month-controls">
			<button
				class="month-nav"
				type="button"
				aria-label="Previous month"
				onclick={() => shiftMonth(-1)}
			>
				<img src={chevronLeftIcon} alt="" />
			</button>
			<button class="today-button" type="button" onclick={goToToday}>Today</button>
			<button class="month-nav" type="button" aria-label="Next month" onclick={() => shiftMonth(1)}>
				<img src={chevronRightIcon} alt="" />
			</button>
		</div>
	</div>

	<div class="calendar-wrapper" bind:this={wrapperEl}>
		<div class="calendar-grid">
			<div class="weekday-row">
				{#each WEEKDAYS as weekday (weekday)}
					<div class="weekday-cell">{weekday}</div>
				{/each}
			</div>
			{#each weeks as week, weekIndex (weekIndex)}
				<div
					class="week-row"
					style:min-height="{Math.max(106, BAR_TOP + week.laneCount * BAR_STRIDE + 12)}px"
				>
					{#each week.days as day, dayIndex (dayIndex)}
						<div class="day-cell" class:day-cell--weekend={dayIndex === 0 || dayIndex === 6}>
							<span class="day-number">{day.getDate()}</span>
						</div>
					{/each}
					{#each week.segments as segment (segment.announcement.id)}
						<button
							class="banner-bar banner-bar--{segment.status}"
							type="button"
							style:left="calc({segment.startCol} / 7 * 100% + 6px)"
							style:width="calc({segment.span} / 7 * 100% - 12px)"
							style:top="{BAR_TOP + segment.lane * BAR_STRIDE}px"
							onclick={(event) => openPopup(event, segment.announcement)}
						>
							{stripHtml(segment.announcement.message)}
						</button>
					{/each}
				</div>
			{/each}
		</div>

		{#if popup}
			<div
				class="calendar-popup"
				bind:this={popupEl}
				style:top="{popup.top}px"
				style:left="{popup.left}px"
				role="dialog"
				aria-label="Announcement details"
			>
				<AnnouncementCard
					announcement={popup.announcement}
					variant="popup"
					onclose={() => (popup = null)}
				/>
			</div>
		{/if}
	</div>

	<div class="calendar-legend">
		<div class="legend-item">
			Active
			<span class="legend-swatch legend-swatch--active"></span>
		</div>
		<div class="legend-item">
			Schedule
			<span class="legend-swatch legend-swatch--scheduled"></span>
		</div>
		<div class="legend-item">
			Expired
			<span class="legend-swatch legend-swatch--expired"></span>
		</div>
	</div>
</div>

<style>
	.calendar-view {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}

	.month-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.month-title {
		margin: 0;
		font-family: var(--type-h2-font);
		font-weight: var(--type-h2-weight);
		font-size: var(--type-h2-size);
		line-height: 2.125rem;
		color: #000000;
	}

	.month-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.month-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.month-nav img {
		display: block;
		width: 8px;
		height: 14px;
	}

	.today-button {
		display: flex;
		align-items: center;
		height: 2.125rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-neutral-0);
		border: 1.5px solid var(--color-neutral-500);
		border-radius: 0.5rem;
		font-family: var(--type-button-font);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-c1);
		color: var(--color-neutral-500);
		cursor: pointer;
	}

	.today-button:hover {
		background: var(--color-neutral-100);
	}

	.calendar-wrapper {
		position: relative;
		width: 100%;
	}

	.calendar-grid {
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.weekday-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 3.125rem;
		background: var(--color-neutral-0);
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-bold);
		font-size: var(--text-b3);
		color: var(--color-text-secondary);
	}

	.week-row {
		position: relative;
		display: grid;
		grid-template-columns: repeat(7, 1fr);
	}

	.day-cell {
		padding: 0.75rem;
		background: var(--color-neutral-0);
		border: 0.5px solid var(--color-neutral-300);
	}

	.day-cell--weekend {
		background: var(--color-neutral-200);
	}

	.day-number {
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: var(--color-text-secondary);
	}

	.banner-bar {
		position: absolute;
		display: block;
		height: 1.5rem;
		padding: 0.25rem 0.75rem;
		border: none;
		border-radius: 0.5rem;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-regular);
		font-size: 0.75rem;
		line-height: 1rem;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.banner-bar:hover {
		filter: brightness(0.96);
	}

	.banner-bar--active {
		background: var(--mfsn-status-active-bg);
		color: var(--mfsn-status-active-text);
	}

	.banner-bar--scheduled {
		background: var(--mfsn-status-scheduled-bg);
		color: var(--mfsn-status-scheduled-text);
	}

	.banner-bar--expired {
		background: var(--mfsn-status-expired-bg);
		color: var(--mfsn-status-expired-text);
	}

	.calendar-popup {
		position: absolute;
		width: min(32.5625rem, 100%);
		z-index: 10;
	}

	.calendar-legend {
		display: flex;
		align-items: center;
		gap: 0.9375rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--type-b3-font);
		font-weight: var(--type-b3-weight);
		font-size: var(--type-b3-size);
		line-height: 1.5rem;
		color: var(--color-text-secondary);
	}

	.legend-swatch {
		width: 1.5625rem;
		height: 0.8125rem;
		border-radius: 0.25rem;
	}

	.legend-swatch--active {
		background: var(--mfsn-status-active-bg);
	}

	.legend-swatch--scheduled {
		background: var(--mfsn-status-scheduled-bg);
	}

	.legend-swatch--expired {
		background: var(--mfsn-status-expired-bg);
	}
</style>
