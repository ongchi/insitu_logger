<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.ts";

  let {
    value = $bindable(),
    options,
    disabled = false,
    addItem,
    deleteItem,
  }: {
    value: string[];
    options: { id: number; name: string }[];
    disabled?: boolean;
    addItem?: (id: string) => void;
    deleteItem?: (id: string) => void;
  } = $props();

  let label = $derived(
    (() => {
      return (
        options
          .filter((option) => value.find((v) => parseInt(v) == option.id))
          .map((option) => option.name)
          .join(", ") || "-Empty-"
      );
    })(),
  );
</script>

<Select.Root
  type="multiple"
  {disabled}
  {value}
  onValueChange={(new_value: string[]) => {
    let update = new Set(new_value);
    let current = new Set(value);

    if (deleteItem) {
      current.difference(update).forEach((item) => {
        deleteItem(item);
      });
    }
    if (addItem) {
      update.difference(current).forEach((item) => {
        addItem(item);
      });
    }

    value = new_value;
  }}
>
  <Select.Trigger>
    <span id="option">{label}</span>
  </Select.Trigger>
  <Select.Content>
    {#each options as option}
      <Select.Item value={`${option.id}`} label={option.name} />
    {/each}
  </Select.Content>
</Select.Root>
