<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input/index.js";
  import { type SampleSet } from "$lib/types.ts";
  import { get_simplified_set, get_name } from "./sample-set-utils.ts";
  import { Check, X, Pencil } from "lucide-svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import EditMenu from "./sample-set-edit-menu.svelte";

  let {
    initialSet,
    onSave,
  }: {
    initialSet: SampleSet[];
    onSave: (set: SampleSet[]) => Promise<boolean>;
  } = $props();

  let currentSet: SampleSet[] = $state(JSON.parse(JSON.stringify(initialSet)));
  let isEditing = $state(false);
  let isSaving = $state(false);

  async function handleSave() {
    let newSet = $state
      .snapshot(currentSet)
      .filter((item) => item.qty > 0)
      .sort((a, b) => a.id - b.id);
    if (JSON.stringify(newSet) !== JSON.stringify(initialSet)) {
      isSaving = true;
      const success = await onSave(newSet);
      isSaving = false;

      if (success) {
        currentSet = [...newSet];
        initialSet = [...newSet];
        isEditing = false;
      } else {
        currentSet = [...initialSet];
      }
    } else {
      isEditing = false;
    }
  }

  function handleCancel() {
    if (JSON.stringify(currentSet) !== JSON.stringify(initialSet)) {
      currentSet = [...initialSet];
    }
    isEditing = false;
  }
</script>

<div class="flex flex-wrap flex-row space-x-1">
  {#each isEditing ? currentSet : get_simplified_set(currentSet) as sample}
    <div class="flex flex-nowrap flex-row m-1">
      {#if typeof sample === "string"}
        <span class="text-nowrap border rounded my-1 px-2">{sample}</span>
      {:else if isEditing}
        <Popover.Root>
          <Popover.Trigger disabled={isSaving}>
            <div class="flex flex-nowrap flex-row">
              <div class="text-nowrap border-l border-y my-1 rounded-l px-2">
                {get_name(sample.id)}
              </div>
              <div
                class="border-r border-y rounded-r my-1 px-1 bg-primary/50 text-primary-foreground"
              >
                {sample.qty}
              </div>
            </div>
          </Popover.Trigger>
          <Popover.Content class="max-w-24">
            <Input
              type="number"
              min={0}
              value={sample.qty}
              onchange={(ev) => {
                sample.qty = parseInt((ev.target as HTMLInputElement).value);
              }}
            />
          </Popover.Content>
        </Popover.Root>
      {:else}
        <div class="text-nowrap border-l border-y my-1 rounded-l px-2">
          {get_name(sample.id)}
        </div>
        <div
          class="border-r border-y rounded-r my-1 px-1 bg-primary/50 text-primary-foreground"
        >
          {sample.qty}
        </div>
      {/if}
    </div>
  {/each}
  {#if isEditing}
    <div>
      <EditMenu bind:currentSet disabled={isSaving} />
      <Button
        variant="ghost"
        size="icon"
        onclick={handleSave}
        disabled={isSaving}
      >
        <Check />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onclick={handleCancel}
        disabled={isSaving}
      >
        <X />
      </Button>
    </div>
  {:else}
    <Button variant="ghost" size="icon" onclick={() => (isEditing = true)}>
      <Pencil />
    </Button>
  {/if}
</div>
