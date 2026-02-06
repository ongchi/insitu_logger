<script lang="ts">
  import { ModeWatcher } from "mode-watcher";
  import "./app.css";
  import TaskListSidebar from "./task-list-sidebar/task-list-sidebar.svelte";
  import TaskItem from "./task-item/task-item.svelte";
  import TaskInfo from "./task-info/task-info.svelte";
  import SensorData from "./sensor-data/sensor-data.svelte";
  import { onMount } from "svelte";
  import { type TaskSummary } from "$lib/types.js";
  import { sharedOptions, selectedTask } from "$lib/shared-variables.svelte.ts";
  import { Toaster } from "$lib/components/ui/sonner/index.js";
  import { ApiClient } from "$lib/api-client.js";
  import { PanelLeft } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  let task_summary_data = $state<TaskSummary[]>([]);
  let sidebarVisible = $state(true);

  function toggleSidebar() {
    sidebarVisible = !sidebarVisible;
  }

  function refreshTaskList() {
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
  }

  onMount(async () => {
    ApiClient.get("/api/well", (data: any) => {
      sharedOptions.well = data;
    });

    ApiClient.get("/api/pump", (data: any) => {
      sharedOptions.pump = data;
    });

    ApiClient.get("/api/sample_type", (data: any) => {
      sharedOptions.sample_type = data;
    });

    refreshTaskList();

    ApiClient.get("/api/people", (data: any) => {
      sharedOptions.people = data;
    });
  });
</script>

<ModeWatcher defaultMode="light" />
<main class="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900">
  <Toaster />

  <!-- Left Sidebar - Task List -->
  {#if sidebarVisible}
    <div
      class="w-80 flex-shrink-0 border-r border-zinc-300 transition-all duration-300 dark:border-zinc-700"
    >
      <TaskListSidebar
        bind:data={task_summary_data}
        onRefresh={refreshTaskList}
      />
    </div>
  {/if}

  <!-- Right Main Content Area -->
  <div class="flex flex-1 flex-col overflow-hidden">
    <!-- Toolbar with Toggle Button -->
    <div
      class="flex items-center border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
    >
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        onclick={toggleSidebar}
      >
        <PanelLeft class="h-4 w-4" />
      </Button>
      {#if selectedTask[0]}
        <TaskItem />
      {/if}
    </div>

    {#if selectedTask[0]}
      <div class="flex-1 overflow-auto">
        <!-- Task Info Section -->
        <TaskInfo />
        <hr />
        <!-- Sensor Data Section -->
        <SensorData />
      </div>
    {:else}
      <!-- Empty State -->
      <div class="flex h-full items-center justify-center">
        <div class="text-center text-zinc-400 dark:text-zinc-600">
          <p class="text-lg font-medium">No Task Selected</p>
          <p class="text-sm">Select a task from the list to view details</p>
        </div>
      </div>
    {/if}
  </div>
</main>
