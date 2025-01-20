<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Check, X, Pencil } from "lucide-svelte";
  import OptionSelector from "$lib/option-selector.svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  let {
    initialValue,
    onSave,
    cell_class = "text-nowrap",
    inputType = "text",
    selectOptions = [],
  }: {
    initialValue: number | string;
    onSave: (newValue: number | string) => Promise<boolean>;
    cell_class?: string;
    inputType?: "text" | "number" | "single_select";
    selectOptions?: { id: number; name: string }[];
    selectProps?: Record<string, any>;
  } = $props();

  let isEditing = $state(false);
  let currentValue = $state(initialValue);
  let isSaving = $state(false);

  async function handleSave() {
    if (currentValue === initialValue) {
      isEditing = false;
      return;
    }

    isSaving = true;
    const success = await onSave(currentValue);
    isSaving = false;

    if (success) {
      isEditing = false;
      initialValue = currentValue;
    } else {
      // Revert to initial value on save failure
      currentValue = initialValue;
    }
  }

  function handleCancel() {
    currentValue = initialValue;
    isEditing = false;
  }
</script>

{#if isEditing}
  <div class="flex items-center">
    {#if inputType === "single_select"}
      <OptionSelector
        bind:value={currentValue as number}
        options={selectOptions}
      />
    {:else}
      <Input type={inputType} bind:value={currentValue} disabled={isSaving} />
    {/if}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
          disabled={isSaving}
          onclick={handleSave}
        >
          <Check />
        </Tooltip.Trigger>
        <Tooltip.Content>Confirm</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
          disabled={isSaving}
          onclick={handleCancel}
        >
          <X />
        </Tooltip.Trigger>
        <Tooltip.Content>Cancel</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
{:else}
  <div class="flex items-center space-x-1">
    <span class={cell_class}>
      {#if inputType === "single_select"}
        {selectOptions.find((option) => option.id == currentValue)?.name ||
          currentValue}
      {:else}
        {currentValue}
      {/if}
    </span>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
          onclick={() => (isEditing = true)}
        >
          <Pencil />
        </Tooltip.Trigger>
        <Tooltip.Content>Edit</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
{/if}
