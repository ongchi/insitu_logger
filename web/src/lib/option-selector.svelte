<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.ts";

  let {
    value = $bindable(),
    options,
    disabled = false,
    onValueChange,
    allowDeselect = true,
  }: {
    value: number | null;
    options: { id: number; name: string }[];
    disabled?: boolean;
    onValueChange?: (value: any) => void;
    allowDeselect?: boolean;
  } = $props();
  let label = $derived(
    (() => {
      return options.find((option) => option.id == value)?.name || "---";
    })(),
  );
</script>

<Select.Root
  type="single"
  value={value?.toString()}
  onValueChange={(new_value: string) => {
    value = parseInt(new_value);
    if (onValueChange) {
      onValueChange(value);
    }
  }}
  {disabled}
  {allowDeselect}
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
