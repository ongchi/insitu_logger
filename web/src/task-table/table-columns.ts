import type { ColumnDef } from '@tanstack/table-core'
import { renderComponent } from '$lib/components/ui/data-table/index.js'
import { Checkbox } from '$lib/components/ui/checkbox/index.js'
import { formatDate } from '$lib/utils.js'
import { sharedOptions } from '$lib/shared-variables.svelte.ts'
import EditableCell from './editable-cell.svelte'
import SampleSetEditor from './sample-set-cell/sample-set-editor.svelte'
import type { TaskSummary, SampleSet } from '$lib/types.ts'
import { getLocalTimeZone } from '@internationalized/date'
import { ApiClient } from '$lib/api-client'

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
          return await ApiClient.patch(
            `/api/task/${row.original.id}`,
            { serial: newValue },
            (_) => true,
            (_) => false
          )
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
          return await ApiClient.patch(
            `/api/task/${row.original.id}`,
            { well_id: newValue },
            (_) => true,
            (_) => false
          )
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
          return await ApiClient.patch(
            `/api/task/${row.original.id}`,
            { depth: newValue },
            (_) => true,
            (_) => false
          )
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
          let updateItems = [...newValue]

          // Items not in the original sample set
          row.original.sample_set.forEach((oldItem) => {
            let maybeDelete = newValue.find(
              (newItem) => newItem.id == oldItem.id
            )
            if (maybeDelete === undefined)
              updateItems.push({ id: oldItem.id, qty: 0 })
          })

          return ApiClient.patch(
            `/api/task/${row.original.id}/sample_set`,
            updateItems,
            (_) => {
              row.original.sample_set = [...newValue]
              return true
            },
            (_) => false
          )
        },
      })
    },
  },

  {
    accessorKey: 'sampling_time',
    header: 'Sampling Time',
    filterFn: (rows, id, filterValue) => {
      let start: Date = filterValue.start.toDate(getLocalTimeZone())
      let end: Date = filterValue.end
        .add({ days: 1 })
        .toDate(getLocalTimeZone())

      if (rows.original.sampling_time === null) {
        return true
      } else {
        return (
          rows.original.sampling_time >= start &&
          rows.original.sampling_time < end
        )
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
