<script lang="ts" generics="TData, TValue">
  import Ellipsis from "lucide-svelte/icons/ellipsis";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import type { Cell } from "@tanstack/table-core";

  let {
    cell,
    onDeleteRow,
  }: { cell: Cell<TData, TValue>; onDeleteRow: Function } = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        variant="ghost"
        size="icon"
        class="relative size-8 p-0"
      >
        <span class="sr-only">Open menu</span>
        <Ellipsis class="size-4" />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item onSelect={() => onDeleteRow(cell.row.original.id)}
      >Delete</DropdownMenu.Item
    >
  </DropdownMenu.Content>
</DropdownMenu.Root>
