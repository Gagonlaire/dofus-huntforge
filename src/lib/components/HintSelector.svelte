<script lang="ts">
	import * as Select from '$lib/components/ui/select/index.js';

	interface Props {
		values: Record<number, App.Hint>;
		onSelect?: (id: number, value: App.Hint) => void;
	}

	let { values, onSelect }: Props = $props();
	const entryCount = $derived(Object.keys(values).length);

	const onValueChange = (value: string) => {
		const id = parseInt(value, 10);
		const hint = values[id];

		onSelect?.(id, hint);
	};
</script>

<Select.Root {onValueChange} type="single">
	<Select.Trigger class="min-w-[180px]" disabled={entryCount <= 0}>
		{entryCount > 0 ? `${entryCount} indice${entryCount > 1 ? 's' : ''}` : "Aucun indice"}
	</Select.Trigger>

	{#if entryCount > 0}
		<Select.Content>
			{#each Object.entries(values) as [key, hint] (key)}
				<Select.Item value={key}>{hint.names.fr}</Select.Item>
			{/each}
		</Select.Content>
	{/if}
</Select.Root>
