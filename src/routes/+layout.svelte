<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<ModeWatcher />

<!-- todo: replace with svelte extended grid -->
<main class="min-h-dvh flex flex-col gap-12 justify-center items-center">
	{@render children()}
</main>
