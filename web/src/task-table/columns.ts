import type { ColumnDef } from '@tanstack/table-core'
import { renderComponent } from '$lib/components/ui/data-table/index.js'
import { Checkbox } from '$lib/components/ui/checkbox/index.js'
import { formatDate } from '$lib/utils.js'
import { sharedOptions, pgClient } from '$lib/shared-variables.svelte.ts'
import EditableCell from './editable-cell.svelte'
import SampleSetLabels from './sample-set-labels.svelte'
import { toast } from 'svelte-sonner'
import { type TaskSummary } from '$lib/types.ts'
import type { PostgrestError } from '@supabase/postgrest-js'

function handle_pg_error(error: PostgrestError | null) {
  if (error) {
    console.log(error)
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
      return renderComponent(SampleSetLabels, {
        sample_set: row.original.sample_set,
      })
    },
  },

  {
    accessorKey: 'pump_id',
    header: 'Pump',
    cell: ({ row }) => {
      const pumpId = row.original.pump_id
      return pumpId
        ? sharedOptions.pump.find((el) => el.id === pumpId)?.name
        : 'N/A'
    },
  },

  {
    accessorKey: 'sampling_time',
    header: 'Sampling Time',
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
