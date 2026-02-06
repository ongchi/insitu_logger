<script lang="ts">
  import { type TaskSummary, type SampleSet } from "$lib/types.js";
  import { sharedOptions, selectedTask } from "$lib/shared-variables.svelte.ts";
  import { formatDate } from "$lib/date-utils.ts";
  import { Plus, Trash2, Download } from "@lucide/svelte";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import Button from "$lib/components/ui/button/button.svelte";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import OptionSelector from "$lib/option-selector.svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { ApiClient } from "$lib/api-client.js";
  import { toast } from "svelte-sonner";
  import { get_simplified_set } from "$lib/sample-set-editor/sample-set-utils.js";

  type TaskListSidebarProps = {
    data: TaskSummary[];
    onRefresh?: () => void;
  };

  let { data = $bindable([]), onRefresh }: TaskListSidebarProps = $props();

  let new_well_id = $state(1);
  let new_depth = $state("0");
  let popover_open = $state(false);

  // Infinite scroll state
  const ITEMS_PER_PAGE = 30;
  let visibleCount = $state(ITEMS_PER_PAGE);
  let scrollContainer: HTMLDivElement;

  // Derived visible tasks
  let visibleTasks = $derived(data.slice(0, visibleCount));

  function selectTask(task: TaskSummary) {
    selectedTask[0] = task;
  }

  function getWellName(wellId: number): string {
    const well = sharedOptions.well.find((w) => w.id === wellId);
    return well ? well.name : "";
  }

  function getSampleSetSummary(sampleSet: SampleSet[]): string {
    if (!sampleSet || sampleSet.length === 0) return "No samples";
    return get_simplified_set(sampleSet)[0] as string;
  }

  function formatSamplingDate(date: Date | null): string {
    if (!date) return "Not scheduled";
    return formatDate(date);
  }

  function addTask() {
    ApiClient.put(
      "/api/task",
      {
        well_id: new_well_id,
        depth: new_depth,
      },
      (newTask: any) => {
        popover_open = false;
        toast.success("Task added successfully");
        // Refresh the task list from the server
        if (onRefresh) {
          onRefresh();
        }
      },
      (err: any) => {
        toast.error("Failed to add task: " + err.message);
      },
    );
  }

  function deleteTask(task: TaskSummary, event: MouseEvent | KeyboardEvent) {
    if (event instanceof MouseEvent) {
      event.stopPropagation();
    }

    if (
      !confirm(`Delete task for ${getWellName(task.well_id)} @ ${task.depth}?`)
    ) {
      return;
    }

    ApiClient.delete(
      `/api/task/${task.id}`,
      () => {
        // Clear selection if deleting the selected task
        if (selectedTask[0]?.id === task.id) {
          selectedTask[0] = undefined as any;
        }
        toast.success("Task deleted successfully");
        // Refresh the task list from the server
        if (onRefresh) {
          onRefresh();
        }
      },
      (err: any) => {
        toast.error("Failed to delete task: " + err.message);
      },
    );
  }

  function handleScroll() {
    if (!scrollContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more items when scrolled past 80%
    if (scrollPercentage > 0.8 && visibleCount < data.length) {
      visibleCount = Math.min(visibleCount + ITEMS_PER_PAGE, data.length);
    }
  }

  // Reset visible count when data changes
  $effect(() => {
    if (data.length > 0 && visibleCount > data.length) {
      visibleCount = Math.min(ITEMS_PER_PAGE, data.length);
    }
  });

  function exportTaskData() {
    let tasks = [
      ["Serial", "Well", "Depth", "Sample Set", "Sampling Time", "Comment"],
    ];

    data.forEach((task) => {
      let sampleSet = get_simplified_set(task.sample_set)[0];
      let sampleSetName = typeof sampleSet === "string" ? sampleSet : "N/A";

      tasks.push([
        task.serial,
        sharedOptions.well.find((w) => w.id === task.well_id)?.name as string,
        task.depth,
        sampleSetName,
        task.sampling_time ? task.sampling_time.toString() : "N/A",
        task.comment ? task.comment : "",
      ]);
    });

    let csvContent =
      "data:text/csv;charset=utf-8," +
      tasks.map((row) => row.join(",")).join("\n");

    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks.csv");
    link.click();
  }
</script>

<div class="flex h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
  <!-- Toolbar -->
  <div
    class="flex items-center justify-between border-b border-zinc-300 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800"
  >
    <div class="flex flex-col">
      <h1 class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Tasks
      </h1>
    </div>
    <div class="flex items-center gap-1">
      <button
        onclick={exportTaskData}
        class={buttonVariants({ variant: "ghost", size: "icon" }) + " h-7 w-7"}
      >
        <Download class="h-4 w-4" />
      </button>
      <Popover.Root bind:open={popover_open}>
        <Popover.Trigger
          class={buttonVariants({ variant: "ghost", size: "icon" }) +
            " h-7 w-7"}
        >
          <Plus class="h-4 w-4" />
        </Popover.Trigger>
        <Popover.Content class="w-80">
          <div class="space-y-4">
            <h4 class="font-medium leading-none">Add New Task</h4>
            <div class="space-y-2">
              <div class="grid gap-2">
                <label for="new-task-well" class="text-sm font-medium"
                  >Well</label
                >
                <OptionSelector
                  bind:value={new_well_id}
                  options={sharedOptions.well}
                />
              </div>
              <div class="grid gap-2">
                <label for="new-task-depth" class="text-sm font-medium"
                  >Depth (m)</label
                >
                <Input
                  id="new-task-depth"
                  bind:value={new_depth}
                  type="string"
                />
              </div>
            </div>
            <Button onclick={addTask} class="w-full">Add Task</Button>
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  </div>

  <!-- Task List -->
  <div
    class="flex-1 overflow-y-auto"
    bind:this={scrollContainer}
    onscroll={handleScroll}
  >
    {#each visibleTasks as task (task.id)}
      <button
        onclick={() => selectTask(task)}
        class="group relative w-full border-b border-zinc-200 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 {selectedTask[0]
          ?.id === task.id
          ? 'bg-blue-500/20 dark:bg-blue-400/30 border-l-4 border-l-blue-600 dark:border-l-blue-400 pl-3.5'
          : 'bg-white'}"
      >
        <!-- Task Header -->
        <div class="mb-1 flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              {#if task.serial}
                <span
                  class="rounded bg-zinc-200 px-1.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                >
                  {task.serial}
                </span>
              {/if}
              <span class="font-semibold text-zinc-900 dark:text-zinc-100">
                {getWellName(task.well_id)}
              </span>
              <span>@</span>
              <span class="text-sm text-zinc-500 dark:text-zinc-400">
                {task.depth}
              </span>
            </div>
          </div>
          <div
            role="button"
            tabindex="0"
            onclick={(e) => deleteTask(task, e)}
            onkeydown={(e) => e.key === "Enter" && deleteTask(task, e)}
            class="opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
          >
            <Trash2 class="h-4 w-4 text-zinc-400 hover:text-red-500" />
          </div>
        </div>

        <!-- Sampling Time -->
        <div class="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
          {formatSamplingDate(task.sampling_time)}
        </div>

        <!-- Sample Set Summary -->
        <div class="truncate text-sm text-zinc-500 dark:text-zinc-500">
          {getSampleSetSummary(task.sample_set)}
        </div>
      </button>
    {/each}

    <!-- Load More Indicator -->
    {#if visibleCount < data.length}
      <div
        class="flex items-center justify-center bg-zinc-50 py-4 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
      >
        <span>Scroll to load more ({data.length - visibleCount} remaining)</span
        >
      </div>
    {/if}
  </div>
</div>
