export type Well = {
  id: number
  name: string
}

export type Pump = {
  id: number
  name: string
}

export type SampleType = {
  id: number
  name: string
}

export type OptionsData = {
  well: Well[]
  pump: Pump[]
  sample_type: SampleType[]
}

export type SampleSet = {
  id: number
  qty: number
}

export type TaskSummary = {
  id: number
  done: boolean
  serial: string
  well_id: number
  depth: number
  sample_set: Array<SampleSet>
  pump_id: number
  sampling_time: Date | null
}
