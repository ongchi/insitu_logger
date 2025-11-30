<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Plus, Eraser } from "lucide-svelte";
  import { sharedOptions } from "$lib/shared-variables.svelte.ts";
  import { type SampleSet } from "$lib/types.ts";
  import { get_id, preset } from "./sample-set-utils.ts";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

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
    if (currentSet === null) {
      currentSet = [];
    }
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
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Plus />
        </Tooltip.Trigger>
        <Tooltip.Content>Add</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    {#if currentSet === null || currentSet.length == 0}
      {#each preset as item}
        <DropdownMenu.Item
          onclick={() => {
            createSet(item.content);
          }}>{item.name}</DropdownMenu.Item
        >
      {/each}
    {:else}
      {#each dropdownOptions as option}
        <DropdownMenu.Item
          onclick={() => {
            currentSet.push({ id: option.id, qty: 1 });
          }}
          >{option.variant
            ? `${option.name} ${option.variant}`
            : option.name}</DropdownMenu.Item
        >
      {/each}
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger
      class={buttonVariants({ variant: "ghost", size: "icon" })}
      onclick={() => {
        while (currentSet.length > 0) {
          currentSet.pop();
        }
      }}
    >
      <Eraser />
    </Tooltip.Trigger>
    <Tooltip.Content>Clear</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>
