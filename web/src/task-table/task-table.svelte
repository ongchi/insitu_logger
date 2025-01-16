<script lang="ts">
  import { columns } from "./task-table-columns.js";
  import { type TaskSummary } from "$lib/types.ts";
  import { ChevronLeft, ChevronRight, Plus, Share } from "lucide-svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import {
    type PaginationState,
    type RowSelectionState,
    getCoreRowModel,
    getPaginationRowModel,
  } from "@tanstack/table-core";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import {
    sharedOptions,
    pgClient,
    selectedTask,
  } from "$lib/shared-variables.svelte";
  import OptionSelector from "$lib/option-selector.svelte";
  import { toast } from "svelte-sonner";
  import { fetch_data } from "$lib/utils.js";
  import DataTableActions from "./table-actions.svelte";
  import { get_simplified_set } from "./sample-set-utils.js";

  let { data }: { data: TaskSummary[] } = $props();

  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 5 });
  let rowSelection = $state<RowSelectionState>({});

  const table = createSvelteTable({
    get data() {
      return data;
    },
    columns,
    enableMultiRowSelection: false,
    state: {
      get pagination() {
        return pagination;
      },
      get rowSelection() {
        return rowSelection;
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        pagination = updater(pagination);
      } else {
        pagination = updater;
      }
    },
    onRowSelectionChange: (updater) => {
      if (typeof updater === "function") {
        rowSelection = updater(rowSelection);
        let rows = table.getSelectedRowModel().rows;
        selectedTask.pop();
        if (rows.length > 0) {
          selectedTask.push(rows[0].original as TaskSummary);
        }
      } else {
        rowSelection = updater;
      }
    },
  });

  // Variables for row creation
  let well_id = $state(0);
  let depth = $state();

  let popoverOpen = $state(false);
  function handleAddTask() {
    pgClient
      .from("task")
      .insert({ well_id: well_id, depth: depth })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
          console.error(error);
        } else {
          popoverOpen = false;
          fetch_data("task_summary", "*", (task_data: any) => {
            data = task_data;
          });
        }
      });
  }

  function onDeleteRow(id: string) {
    pgClient
      .from("task")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          data = data.filter((row: any) => row.id !== id);
          table.setRowSelection({});
          toast.success("Task deleted");
        }
      });
  }

  function exportTaskData() {
    let tasks = [["Serial", "Well", "Depth", "Sample Set", "Sampling Time"]];
    data.forEach((task) => {
      let sampleSet = get_simplified_set(task.sample_set)[0];
      let sampleSetName = typeof sampleSet === "string" ? sampleSet : "N/A";

      tasks.push([
        task.serial,
        sharedOptions.well.find((w) => w.id === task.well_id)?.name as string,
        task.depth,
        sampleSetName,
        task.sampling_time ? task.sampling_time.toString() : "N/A",
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
    link.remove();
  }

  $effect(() => {
    if (popoverOpen) {
      well_id = 0;
      depth = "";
    }
  });
</script>

<div class="w-full px-2 py-2">
  <div class="flex items-center justify-between space-x-2 text-sm">
    <div class="flex items-center space-x-2">
      <Popover.Root bind:open={popoverOpen}>
        <Popover.Trigger class={buttonVariants({ variant: "ghost" })}
          ><Plus />Add Task</Popover.Trigger
        >
        <Popover.Content class="w-80">
          <div class="grid gap-4">
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="well">Well</Label>
              <div class="col-span-2 h-8">
                <OptionSelector
                  bind:value={well_id}
                  options={sharedOptions.well}
                />
              </div>
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="depth">Depth</Label>
              <Input id="depth" bind:value={depth} class="col-span-2 h-8" />
            </div>
            <div class="flex justify-end space-x-2 mt-4">
              <Button variant="ghost" onclick={() => (popoverOpen = false)}
                >Cancel</Button
              >
              <Button onclick={handleAddTask}>Add</Button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>
      <Button variant="ghost" onclick={exportTaskData}><Share />Export</Button>
    </div>
    <div class="flex items-center space-x-2 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        onclick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <ChevronLeft />
      </Button>
      <div class="flex space-x-1">
        <span>Page</span>
        <Input
          type="number"
          min="1"
          max={table.getPageCount()}
          value={table.getState().pagination.pageIndex + 1}
          oninput={(e) => {
            const element = e.target as HTMLInputElement;
            const page = parseInt(element.value);
            if (page >= 1 && page <= table.getPageCount()) {
              table.setPageIndex(page - 1);
            }
          }}
          class="px-2 h-[1em] w-[4em] border rounded text-center"
        />
        <span>of {table.getPageCount()}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onclick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <ChevronRight />
      </Button>
    </div>
  </div>
  <div class="border rounded-xl p-2">
    {#key data}
      <Table.Root>
        <Table.Header>
          {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
            <Table.Row>
              {#each headerGroup.headers as header (header.id)}
                <Table.Head>
                  {#if !header.isPlaceholder}
                    <FlexRender
                      content={header.column.columnDef.header}
                      context={header.getContext()}
                    />
                  {/if}
                </Table.Head>
              {/each}
            </Table.Row>
          {/each}
        </Table.Header>
        <Table.Body>
          {#each table.getRowModel().rows as row (row.id)}
            <Table.Row data-state={row.getIsSelected() && "selected"}>
              {#each row.getVisibleCells() as cell (cell.id)}
                <Table.Cell>
                  {#if cell.column.id === "actions"}
                    <DataTableActions {cell} {onDeleteRow} />
                  {:else}
                    <FlexRender
                      content={cell.column.columnDef.cell}
                      context={cell.getContext()}
                    />
                  {/if}
                </Table.Cell>
              {/each}
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={columns.length}>No results.</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/key}
  </div>
</div>
