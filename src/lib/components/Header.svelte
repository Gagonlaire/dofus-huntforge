<script>
    import {Button} from "$lib/components/ui/button";
    import Settings from 'lucide-svelte/icons/settings';
    import Pencil from 'lucide-svelte/icons/pencil';
</script>

<section class="flex justify-between items-center sticky top-0 left-0 w-full px-5 py-2 border-b">
    <span class="font-raleway font-bold text-2xl">HuntForge</span>

    <div class="flex gap-4 items-center">
        <Button size="sm" variant="secondary">
            <span>Edit layout</span>
            <Pencil />
        </Button>

        <Button size="icon">
            <Settings />
        </Button>
    </div>
</section>
