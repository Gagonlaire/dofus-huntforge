<script lang="ts">
	import { Button } from '@/components/ui/button';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';

	interface Props {
		direction?: App.Direction;
		onDirectionChange?: (direction: App.Direction) => void;
	}

	let { direction: selectedDirection = $bindable(undefined), onDirectionChange }: Props = $props();

	const handleDirectionChange = (newDirection: App.Direction) => {
		selectedDirection = newDirection;
		onDirectionChange?.(newDirection);
	};
</script>

{#snippet direction(d: App.Direction, rotation = 0)}
	<Button onclick={() => handleDirectionChange(d)}
					variant={d === selectedDirection ? "default" : "outline"}
					size="icon" class="size-14 cursor-pointer">
		<ChevronUp style="transform: rotate({rotation}deg)" class="size-[80%]" />
	</Button>
{/snippet}

<div class="grid grid-cols-2 gap-1.25 rotate-45">
	{@render direction(0, -45)}
	{@render direction(1, 45)}
	{@render direction(3, -135)}
	{@render direction(2, 135)}
</div>
