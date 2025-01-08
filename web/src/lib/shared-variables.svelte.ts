import { type OptionsData, type TaskSummary, type TaskInfo } from './types.ts'
import { PostgrestClient } from '@supabase/postgrest-js'

export const sharedOptions: OptionsData = $state({
  well: [],
  pump: [],
  sample_type: [],
  people: [],
})

export const selectedTask: TaskSummary[] = $state([])
export const selectedTaskInfo: TaskInfo[] = $state([])

export const token = $state(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiZmllbGRfdXNlciJ9.o2y6ypM0xgYlXY8LsqEMuNkve-CBM4nP8pBvkGRzRk4'
)

export const pgClient: PostgrestClient = $state(
  new PostgrestClient('http://localhost:3000', {
    headers: { Authorization: `Bearer ${token}` },
  })
)

export const setS = [
  { name: 'Trace', qty: 1 },
  { name: 'IC', qty: 2 },
  { name: 'DOC', qty: 2 },
  { name: 'TM', qty: 1 },
  { name: 'ALK', qty: 1 },
  { name: 'HS-', qty: 2 },
  { name: 'I-', qty: 2 },
  { name: 'Ra', qty: 1 },
]

export const setL = [
  { name: 'Trace', qty: 1 },
  { name: 'IC', qty: 2 },
  { name: 'DOC', qty: 2 },
  { name: 'TM', qty: 1 },
  { name: 'ALK', qty: 1 },
  { name: 'HO', qty: 3 },
  { name: 'DIC', qty: 4 },
  { name: 'HS-', qty: 2 },
  { name: 'I-', qty: 2 },
  { name: 'Ra', qty: 1 },
  { name: 'Sr_Isotope', qty: 1 },
  { name: 'SO4_1L', qty: 1 },
  { name: '真空瓶', qty: 1 },
  { name: '血清瓶_250mL', qty: 2 },
]
