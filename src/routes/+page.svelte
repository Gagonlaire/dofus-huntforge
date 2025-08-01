<script lang="ts">
	import DirectionSelector from '@/components/DirectionSelector.svelte';
	import PositionSelector from '@/components/PositionSelector.svelte';
	import { createHuntContext } from '@/context/HuntContext.svelte';
	import HintSelector from '@/components/HintSelector.svelte';

	const huntCtx = createHuntContext();
</script>

<PositionSelector bind:position={huntCtx.position} />
<DirectionSelector bind:direction={huntCtx.direction} />
<HintSelector onSelect={(id) => huntCtx.moveTo(id)} values={huntCtx.hints} />
