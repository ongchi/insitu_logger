<script lang="ts">
  import * as Select from "$lib/components/ui/select/index.ts";

  let {
    value = $bindable(),
    options,
  }: { value: number; options: { id: number; name: string }[] } = $props();
  let label = $derived(
    (() => {
      return (
        options.find((option) => option.id == value)?.name || "Select an option"
      );
    })(),
  );
</script>

<Select.Root
  type="single"
  onValueChange={(new_value: string) => {
    value = parseInt(new_value);
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
