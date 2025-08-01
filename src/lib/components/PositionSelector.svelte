<script lang="ts">
	import { Input } from '@/components/ui/input/index.js';

	interface Props {
		position?: App.Position;
		onPositionChange?: (position: App.Position) => void;
	}

	let { position: currentPosition = $bindable({ x: NaN, y: NaN }), onPositionChange }: Props = $props();

	const handlePositionChange = async () => {
		onPositionChange?.(currentPosition);
	};
</script>

<section class="grid grid-cols-2 gap-4">
	<Input oninput={handlePositionChange} type="number" bind:value={currentPosition.x} />
	<Input oninput={handlePositionChange} type="number" bind:value={currentPosition.y} />
</section>
