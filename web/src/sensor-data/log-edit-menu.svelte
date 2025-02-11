<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Wrench } from "lucide-svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  let {
    disabled,
    onClearLogData,
  }: {
    disabled: boolean;
    onClearLogData: () => void;
  } = $props();

  let dropdownIsOpen = $state(false);
  let clearDialogIsOpen = $state(false);
</script>

<DropdownMenu.Root bind:open={dropdownIsOpen}>
  <DropdownMenu.Trigger {disabled}>
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" })}
          {disabled}
        >
          <Wrench />
        </Tooltip.Trigger>
        <Tooltip.Content>Edit</Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item closeOnSelect={false}>
      <Dialog.Root bind:open={clearDialogIsOpen}>
        <Dialog.Trigger class="w-full text-left">Clear</Dialog.Trigger>
        <Dialog.Content class="sm:max-w-[425px]">
          <Dialog.Header>
            <Dialog.Title>Clear this log data?</Dialog.Title>
            <Dialog.Description>
              This action cannot be undone.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Footer>
            <Button
              onclick={() => {
                clearDialogIsOpen = false;
                dropdownIsOpen = false;
                onClearLogData();
              }}>CLear</Button
            >
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
