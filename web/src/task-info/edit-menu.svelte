<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Pencil } from "lucide-svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  let {
    disabled,
    onAddTaskInfo,
    onDeleteTaskInfo,
  }: {
    disabled: boolean;
    onAddTaskInfo: () => void;
    onDeleteTaskInfo: () => void;
  } = $props();

  let dropdownIsOpen = $state(false);
  let deleteDialogIsOpen = $state(false);
</script>

<DropdownMenu.Root bind:open={dropdownIsOpen}>
  <DropdownMenu.Trigger {disabled}>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
          {disabled}
        >
          <Pencil />
        </Tooltip.Trigger>
        <Tooltip.Content>Edit</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item onSelect={onAddTaskInfo}>Add</DropdownMenu.Item>
    <DropdownMenu.Item closeOnSelect={false}>
      <Dialog.Root bind:open={deleteDialogIsOpen}>
        <Dialog.Trigger class="w-full text-left">Delete</Dialog.Trigger>
        <Dialog.Content class="sm:max-w-[425px]">
          <Dialog.Header>
            <Dialog.Title>Delete this record?</Dialog.Title>
            <Dialog.Description>
              This action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Button
              onclick={() => {
                deleteDialogIsOpen = false;
                dropdownIsOpen = false;
                onDeleteTaskInfo();
              }}>Delete</Button
            >
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
