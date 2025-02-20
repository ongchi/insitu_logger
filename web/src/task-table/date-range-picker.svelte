<script lang="ts">
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import type { DateRange } from "bits-ui";
  import {
    CalendarDate,
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";

  let { onValueChange }: { onValueChange: (value: DateRange) => void } =
    $props();

  const df = new DateFormatter("zh-TW", {
    dateStyle: "short",
  });

  let value: DateRange = $state(
    (() => {
      let monday = getMonday(new Date());
      let start = new CalendarDate(
        monday.getFullYear(),
        monday.getMonth() + 1,
        monday.getDate(),
      );
      let end = start.add({ days: 4 });
      return { start, end };
    })(),
  );

  let startValue: DateValue | undefined = $state(undefined);

  function getMonday(d: Date) {
    let day = d.getDay();
    let diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }
</script>

<div class="grid gap-2">
  <Popover.Root>
    <Popover.Trigger
      class={cn(
        buttonVariants({ variant: "outline" }),
        !value && "text-muted-foreground",
      )}
    >
      <CalendarIcon class="mr-2 size-4" />
      {#if value && value.start}
        {#if value.end}
          {df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
            value.end.toDate(getLocalTimeZone()),
          )}
        {:else}
          {df.format(value.start.toDate(getLocalTimeZone()))}
        {/if}
      {:else if startValue}
        {df.format(startValue.toDate(getLocalTimeZone()))}
      {:else}
        Pick a date
      {/if}
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
      <RangeCalendar
        bind:value
        onStartValueChange={(v) => {
          startValue = v;
        }}
        {onValueChange}
      />
    </Popover.Content>
  </Popover.Root>
</div>
