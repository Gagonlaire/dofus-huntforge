<script lang="ts">
    import Grid, { GridItem } from 'svelte-grid-extended';

    const itemSize = { height: 40 };
</script>



<Grid {itemSize} cols={10} rows={0} collision="push">
    <GridItem x={1} y={0} class="item">Hey</GridItem>
    <GridItem x={3} y={3} w={4} class="item">Hoy</GridItem>
</Grid>