import type { ColumnDef } from '@tanstack/table-core'
import { renderComponent } from '$lib/components/ui/data-table/index.js'
import { Checkbox } from '$lib/components/ui/checkbox/index.js'
import { formatDate } from '$lib/utils.js'
import { sharedOptions, pgClient } from '$lib/shared-variables.svelte.ts'
import EditableCell from './editable-cell.svelte'
import SampleSetEditor from './sample-set-cell/sample-set-editor.svelte'
import { toast } from 'svelte-sonner'
import type { TaskSummary, SampleSet } from '$lib/types.ts'
import type { PostgrestError } from '@supabase/postgrest-js'
import { getLocalTimeZone, } from "@internationalized/date";

function handle_pg_error(error: PostgrestError | null) {
  if (error) {
    console.error(error)
    toast(error.message)
    return false
  } else {
    return true
  }
}

export const columns: ColumnDef<TaskSummary>[] = [
  {
    id: 'select',
    cell: ({ row }) =>
      renderComponent(Checkbox, {
        checked: row.getIsSelected(),
        onCheckedChange: (value: any) => row.toggleSelected(!!value),
        controlledChecked: true,
        'aria-label': 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'serial',
    header: 'Serial',
    cell: ({ row }) => {
      const initialValue = row.original.serial
      return renderComponent(EditableCell, {
        initialValue,
        inputType: 'text',
        onSave: async (newValue: string) => {
          const { error } = await pgClient
            .from('task')
            .update({ serial: newValue })
            .eq('id', row.original.id)
          return handle_pg_error(error)
        },
      })
    },
  },

  {
    accessorKey: 'well_id',
    header: 'Well',
    cell: ({ row }) => {
      const initialValue = row.original.well_id.toString()
      const wellOptions = sharedOptions.well
      return renderComponent(EditableCell, {
        initialValue,
        inputType: 'single_select',
        selectOptions: wellOptions,
        onSave: async (newValue: number) => {
          const { error } = await pgClient
            .from('task')
            .update({ well_id: newValue })
            .eq('id', row.original.id)
          return handle_pg_error(error)
        },
      })
    },
  },

  {
    accessorKey: 'depth',
    header: 'Depth (m)',
    cell: ({ row }) => {
      const initialValue = row.original.depth.toString()
      return renderComponent(EditableCell, {
        initialValue,
        inputType: 'string',
        onSave: async (newValue: string) => {
          const { error } = await pgClient
            .from('task')
            .update({ depth: newValue })
            .eq('id', row.original.id)
          return handle_pg_error(error)
        },
      })
    },
  },

  {
    accessorKey: 'sample_set',
    header: 'Sample Set',
    cell: ({ row }) => {
      return renderComponent(SampleSetEditor, {
        initialSet: row.original.sample_set,
        onSave: async (newValue: SampleSet[]) => {
          if (row.original.sample_set === null) {
            row.original.sample_set = []
          }

          let addItem: SampleSet[] = []
          // Items not in the original sample set
          newValue.forEach((newItem) => {
            let maybeAdd = row.original.sample_set.find((oldItem) => newItem.id == oldItem.id)
            if (maybeAdd === undefined) addItem.push(newItem)
          })
          // Items in the original sample set with different qty
          newValue.forEach((newItem) => {
            let maybeUpdate = row.original.sample_set
              .find((oldItem) => (newItem.id == oldItem.id) && (newItem.qty != oldItem.qty))
            if ((newItem.qty > 0) && (maybeUpdate !== undefined)) addItem.push(newItem)
          })

          const { error: upsert_error } = await pgClient
            .from('sample_set')
            .upsert(
              addItem.map((item) => {
                return { task_id: row.original.id, sample_type_id: item.id, qty: item.qty }
              }))

          if (upsert_error) {
            handle_pg_error(upsert_error)
            return false
          }

          let deleteItem: SampleSet[] = []
          if (newValue.length === 0) {
            // Delete all items when newValue is empty
            row.original.sample_set.forEach((oldItem) => {
              deleteItem.push(oldItem)
            })
          } else {
            // Items in the original sample set with qty = 0
            newValue.forEach((newItem) => {
              if (newItem.qty < 1) {
                deleteItem.push(newItem)
              }
            })
            // Items not in the original sample set
            row.original.sample_set.forEach((oldItem) => {
              let maybeDelete = newValue.find((newItem) => newItem.id == oldItem.id)
              if (maybeDelete === undefined) deleteItem.push(oldItem)
            })
          }

          const { error: delete_error } = await pgClient
            .from('sample_set')
            .delete()
            .eq('task_id', row.original.id)
            .in('sample_type_id', deleteItem.map((item) => item.id))

          if (delete_error) {
            handle_pg_error(delete_error)
            return false
          }

          // if update success
          row.original.sample_set = [...newValue.filter((item) => item.qty > 0)]

          return true
        }
      })
    },
  },

  {
    accessorKey: 'sampling_time',
    header: 'Sampling Time',
    filterFn: (rows, id, filterValue) => {
      let start: Date = filterValue.start.toDate(getLocalTimeZone());
      let end: Date = filterValue.end.add({ days: 1 }).toDate(getLocalTimeZone());

      if (rows.original.sampling_time === null) {
        return true
      } else {
        return rows.original.sampling_time >= start && rows.original.sampling_time < end
      }
    },
    cell: ({ row }) => {
      const date = row.original.sampling_time
      if (date === null) {
        return 'N/A'
      } else {
        return formatDate(new Date(date))
      }
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    enableHiding: false,
  },
]
