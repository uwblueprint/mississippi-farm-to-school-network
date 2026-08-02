<script lang="ts">
	import { toDateString } from '$lib/utils/announcement-dates';
	import chevronLeftIcon from '$lib/assets/announcements/chevron-left.svg';
	import chevronRightIcon from '$lib/assets/announcements/chevron-right.svg';

	const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	interface Props {
		month: Date;
		rangeStart: string | null;
		rangeEnd: string | null;
		onprev: () => void;
		onnext: () => void;
		onselect: (date: string) => void;
	}

	let { month, rangeStart, rangeEnd, onprev, onnext, onselect }: Props = $props();

	const label = $derived(month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));

	const weeks = $derived.by(() => {
		const year = month.getFullYear();
		const monthIndex = month.getMonth();
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const leadingBlanks = new Date(year, monthIndex, 1).getDay();

		const cells: (Date | null)[] = [
			...Array.from({ length: leadingBlanks }, () => null),
			...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1))
		];
		while (cells.length % 7 !== 0) cells.push(null);

		const rows: (Date | null)[][] = [];
		for (let i = 0; i < cells.length; i += 7) {
			rows.push(cells.slice(i, i + 7));
		}
		return rows;
	});

	function dayState(day: Date) {
		const value = toDateString(day);
		const hasFullRange = rangeStart !== null && rangeEnd !== null && rangeStart !== rangeEnd;
		return {
			value,
			isEndpoint: value === rangeStart || value === rangeEnd,
			isRangeStart: hasFullRange && value === rangeStart,
			isRangeEnd: hasFullRange && value === rangeEnd,
			inRange: rangeStart !== null && rangeEnd !== null && value > rangeStart && value < rangeEnd
		};
	}
</script>

<div class="mini-calendar">
	<div class="mini-header">
		<button class="mini-nav" type="button" aria-label="Previous month" onclick={onprev}>
			<img src={chevronLeftIcon} alt="" />
		</button>
		<span class="mini-title">{label}</span>
		<button class="mini-nav" type="button" aria-label="Next month" onclick={onnext}>
			<img src={chevronRightIcon} alt="" />
		</button>
	</div>

	<div class="mini-weekdays">
		{#each WEEKDAYS as weekday (weekday)}
			<span>{weekday}</span>
		{/each}
	</div>

	<div class="mini-grid">
		{#each weeks as week, weekIndex (weekIndex)}
			<div class="mini-week">
				{#each week as day, dayIndex (dayIndex)}
					{#if day}
						{@const state = dayState(day)}
						<button
							class="mini-day"
							class:mini-day--in-range={state.inRange}
							class:mini-day--range-start={state.isRangeStart}
							class:mini-day--range-end={state.isRangeEnd}
							class:mini-day--endpoint={state.isEndpoint}
							type="button"
							onclick={() => onselect(state.value)}
						>
							<span class="mini-day-label">{day.getDate()}</span>
						</button>
					{:else}
						<span class="mini-day mini-day--blank"></span>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.mini-calendar {
		display: flex;
		flex-direction: column;
		gap: 1.375rem;
		width: fit-content;
		padding: 1.5rem;
		background: var(--color-neutral-0);
		border: 1px solid var(--color-neutral-300);
		border-radius: 0.5rem;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}

	.mini-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.mini-title {
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-medium);
		font-size: var(--text-b3);
		line-height: 0.875rem;
		color: var(--color-neutral-600);
	}

	.mini-nav {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
	}

	.mini-nav img {
		display: block;
		width: 6px;
		height: 10.5px;
	}

	.mini-weekdays {
		display: flex;
	}

	.mini-weekdays span {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 1.25rem;
		font-family: var(--font-dm-sans);
		font-weight: 600;
		font-size: 0.625rem;
		line-height: 0.75rem;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--color-neutral-400);
	}

	.mini-grid {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.mini-week {
		display: flex;
	}

	.mini-day {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		background: transparent;
		border: none;
		font-family: var(--font-dm-sans);
		font-weight: var(--font-weight-medium);
		font-size: 0.9375rem;
		line-height: 1.125rem;
		color: var(--color-text-primary);
		cursor: pointer;
	}

	.mini-day--blank {
		cursor: default;
		pointer-events: none;
	}

	.mini-day--in-range {
		background: #ffe2e2;
	}

	.mini-day--range-start::before,
	.mini-day--range-end::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 50%;
		background: #ffe2e2;
	}

	.mini-day--range-start::before {
		right: 0;
	}

	.mini-day--range-end::before {
		left: 0;
	}

	.mini-day:not(.mini-day--endpoint):not(.mini-day--in-range):hover .mini-day-label {
		background: var(--color-neutral-100);
		border-radius: 50%;
	}

	.mini-day-label {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
	}

	.mini-day--endpoint .mini-day-label {
		background: var(--color-brand-primary);
		border-radius: 50%;
		font-weight: 600;
		color: #ffffff;
	}
</style>
