<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import "./app.css";
  import TaskTable from "./task-table/task-table.svelte";
  import TaskInfo from "./task-info/task-info.svelte";
  import SensorData from "./sensor-data/sensor-data.svelte";
  import { onMount } from "svelte";
  import { type TaskSummary } from "$lib/types.js";
  import { sharedOptions } from "$lib/shared-variables.svelte.ts";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import { fetch_data } from "$lib/utils.js";
  import { setMode } from "mode-watcher";

  let task_summary_data: TaskSummary[] = [];

  onMount(async () => {
    setMode("light");
    fetch_data("well", "id,name,type", (data: any) => {
      sharedOptions.well = data;
    });
    fetch_data("pump", "id,name", (data: any) => {
      sharedOptions.pump = data;
    });
    fetch_data("sample_type", "id,name,variant", (data: any) => {
      sharedOptions.sample_type = data;
    });
    fetch_data("task_summary", "*", (data: any) => {
      task_summary_data = data.map((d: any) => {
        if (d.sample_set === null) {
          d.sample_set = [];
        }
        if (d.sampling_time !== null) {
          d.sampling_time = new Date(d.sampling_time);
        }
        return d;
      });
    });
    fetch_data("people", "id,name", (data: any) => {
      sharedOptions.people = data;
    });
  });
</script>

<ModeWatcher />
<main>
  <Toaster />
  <TaskTable data={task_summary_data} />
  <TaskInfo />
  <SensorData />
</main>
