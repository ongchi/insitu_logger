<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import "./app.css";
  import TaskTable from "./task-table/data-table.svelte";
  import { columns } from "./task-table/columns.js";
  import { onMount } from "svelte";
  import { type TaskSummary } from "$lib/types.js";
  import { sharedOptions } from "$lib/shared-variables.svelte.ts";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import { fetch_data } from "$lib/utils.js";

  let task_summary_data: TaskSummary[] = [];

  onMount(async () => {
    fetch_data("well", "id,name", (data: any) => {
      sharedOptions.well = data;
    });
    fetch_data("pump", "id,name", (data: any) => {
      sharedOptions.pump = data;
    });
    fetch_data("sample_type", "id,name", (data: any) => {
      sharedOptions.sample_type = data;
    });
    fetch_data("task_summary", "*", (data: any) => {
      task_summary_data = data;
    });
  });
</script>

<ModeWatcher />
<main>
  <Toaster />
  <TaskTable data={task_summary_data} {columns} />
</main>
