<script>
    import { Input } from "$lib/components/ui/input";

    let x = $state(0);
    let y = $state(0);
</script>

<section class="w-screen h-screen flex flex-col justify-center items-center">
    <div class="flex items-center gap-6">
        <Input bind:value={x} type="number" />
        <Input bind:value={y} type="number" />
    </div>
</section>
