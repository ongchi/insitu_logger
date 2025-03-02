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
  import { setMode } from "mode-watcher";
  import { ApiClient } from "$lib/api-client.js";

  let task_summary_data: TaskSummary[] = [];

  onMount(async () => {
    setMode("light");
    ApiClient.get("/api/well", (data: any) => {
      sharedOptions.well = data;
    });
    ApiClient.get("/api/pump", (data: any) => {
      sharedOptions.pump = data;
    });
    ApiClient.get("/api/sample_type", (data: any) => {
      sharedOptions.sample_type = data;
    });
    ApiClient.get("/api/task/summary", (data: any) => {
      task_summary_data = data.map((d: any) => {
        if (d.sample_set == null) {
          d.sample_set = [];
        } else {
          d.sample_set = JSON.parse(d.sample_set);
        }
        if (d.sampling_time != null) {
          d.sampling_time = new Date(d.sampling_time);
        }
        return d;
      });
    });
    ApiClient.get("/api/people", (data: any) => {
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
