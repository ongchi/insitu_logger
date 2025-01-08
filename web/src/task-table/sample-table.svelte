<script lang="ts">
  import type { ColumnDef } from "@tanstack/table-core";
  import type { SampleSet } from "$lib/types.ts";
  import { renderComponent } from "$lib/components/ui/data-table/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import {
    createSvelteTable,
    FlexRender,
  } from "$lib/components/ui/data-table/index.js";
  import { sharedOptions } from "$lib/shared-variables.svelte";
  import EditableCell from "./editable-cell.svelte";
  import { getCoreRowModel } from "@tanstack/table-core";
  import DataTableActions from "./table-actions.svelte";

  let { data } = $props();

  const columns: ColumnDef<SampleSet>[] = [
    {
      accessorKey: "sample_type_id",
      header: "Sample Type",
      cell: ({ row }) => {
        const sampleTypeId = row.original.id;
        return sampleTypeId
          ? sharedOptions.sample_type.find((el) => el.id === sampleTypeId)?.name
          : "N/A";
      },
    },

    {
      accessorKey: "qty",
      header: "Quantity",
      cell: ({ row }) => {
        const initialValue = row.original.qty;
        return renderComponent(EditableCell, {
          initialValue,
          inputType: "number",
          onSave: async (newValue) => {
            data.forEach((el: any) => {
              if (el.id == row.original.id) {
                el.qty = newValue;
              }
            });
            return true;
          },
        });
      },
    },
  ];

  const table = createSvelteTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function onDeleteRow(id: string) {
    console.log("Delete row with id: ", id);
  }
</script>

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
