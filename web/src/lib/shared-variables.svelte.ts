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
