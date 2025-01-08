<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Plus, Eraser } from "lucide-svelte";
  import { sharedOptions, setS, setL } from "$lib/shared-variables.svelte.ts";
  import { type SampleSet } from "$lib/types.ts";
  import { get_id } from "./sample-set-utils.ts";

  let {
    currentSet = $bindable(),
    disabled,
  }: {
    currentSet: SampleSet[];
    disabled: boolean;
  } = $props();

  let dropdownIsOpen = $state(false);
  let dropdownOptions = $derived(
    sharedOptions.sample_type.filter(
      (option) =>
        currentSet.find((current) => current.id == option.id) === undefined,
    ),
  );

  let createSet = (set: { name: string; qty: number }[]) => {
    set.forEach((item) => {
      let maybeItem = currentSet.find(
        (current) => current.id == get_id(item.name),
      );
      if (maybeItem === undefined) {
        currentSet.push({ id: get_id(item.name), qty: item.qty });
      } else {
        maybeItem.qty = item.qty;
      }
    });
  };
</script>

<DropdownMenu.Root bind:open={dropdownIsOpen}>
  <DropdownMenu.Trigger {disabled}>
    <Button variant="ghost" size="icon" class="relative size-8 p-0">
      <Plus />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item
      onclick={() => {
        createSet(setS);
      }}>小褔</DropdownMenu.Item
    >
    <DropdownMenu.Item
      onclick={() => {
        createSet(setL);
      }}>大褔</DropdownMenu.Item
    >
    <DropdownMenu.Separator />
    {#each dropdownOptions as option}
      <DropdownMenu.Item
        onclick={() => {
          currentSet.push({ id: option.id, qty: 1 });
        }}>{option.name}</DropdownMenu.Item
      >
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
<Button
  variant="ghost"
  size="icon"
  class="relative size-8 p-0"
  onclick={() => {
    while (currentSet.length > 0) {
      currentSet.pop();
    }
  }}><Eraser /></Button
>
