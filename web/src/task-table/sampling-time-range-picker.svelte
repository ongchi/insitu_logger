<script lang="ts">
  import CalendarIcon from "lucide-svelte/icons/calendar";
  import type { DateRange } from "bits-ui";
  import {
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
  } from "@internationalized/date";
  import { cn } from "$lib/utils.js";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import { findMonday } from "$lib/utils.js";
  import { CalendarDate } from "@internationalized/date";
  import { onMount } from "svelte";
  import { ApiClient } from "$lib/api-client";

  let {
    onValueChange,
  }: {
    onValueChange: (newValue: DateRange | undefined) => void;
  } = $props();

  let value: DateRange | undefined = $state(undefined);

  const df = new DateFormatter("zh-TW", {
    dateStyle: "short",
  });

  let startValue: DateValue | undefined = $state(undefined);

  function initValue() {
    ApiClient.get("/api/task/last_timestamp", (lastTimestamp) => {
      if (lastTimestamp) {
        let monday = findMonday(new Date(lastTimestamp));
        let start = new CalendarDate(
          monday.getFullYear(),
          monday.getMonth() + 1,
          monday.getDate(),
        );
        let end = start.add({ days: 4 });
        value = { start, end };
        onValueChange(value);
      } else {
        value = undefined;
      }
    });
  }

  onMount(() => {
    initValue();
  });

  export function setValue(newValue: DateRange) {
    value = { ...newValue };
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
      <Separator />
      <Button
        class="w-full"
        variant="ghost"
        onclick={(_) => {
          let monday = findMonday(new Date());
          let start = new CalendarDate(
            monday.getFullYear(),
            monday.getMonth() + 1,
            monday.getDate(),
          );
          let end = start.add({ days: 4 });
          value = { start, end };
          onValueChange(value);
        }}>This Week</Button
      >
      <Separator />
      <div class="flex flex-row">
        <Button
          class="flex-grow"
          variant="ghost"
          onclick={(_) => {
            initValue();
          }}>Reset</Button
        >
        <Separator orientation="vertical" />
        <Button
          class="flex-grow"
          variant="ghost"
          onclick={(_) => {
            value = undefined;
            startValue = undefined;
            onValueChange(undefined);
          }}>Clear</Button
        >
      </div>
    </Popover.Content>
  </Popover.Root>
</div>
