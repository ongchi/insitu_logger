import { type OptionsData, type TaskSummary, type TaskInfo } from './types.ts'

export const sharedOptions: OptionsData = $state({
  well: [],
  pump: [],
  sample_type: [],
  people: [],
})

export const selectedTask: TaskSummary[] = $state([])
export const selectedTaskInfo: TaskInfo[] = $state([])

export const apiUrl = (import.meta as any).env.VITE_API_URL

export const setS = [
  { name: 'Trace', qty: 1 },
  { name: 'IC', qty: 1 },
  { name: 'DOC', qty: 2 },
  { name: 'ALK', qty: 1 },
  { name: 'HS-', qty: 2 },
  { name: 'I-', qty: 2 },
  { name: 'Ra', qty: 1 },
]

export const setL = [
  { name: 'Trace', qty: 1 },
  { name: 'IC', qty: 2 },
  { name: 'DOC', qty: 2 },
  { name: 'ALK', qty: 1 },
  { name: 'HO', qty: 3 },
  { name: 'DIC', qty: 4 },
  { name: 'HS-', qty: 2 },
  { name: 'I-', qty: 2 },
  { name: 'Ra', qty: 1 },
  { name: 'Sr Isotope', qty: 1 },
  { name: 'SO4', qty: 1 },
  { name: '真空瓶', qty: 1 },
  { name: '血清瓶', qty: 2 },
]
