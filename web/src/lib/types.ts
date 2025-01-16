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

export type People = {
  id: number
  name: string
}

export type OptionsData = {
  well: Well[]
  pump: Pump[]
  sample_type: SampleType[]
  people: People[]
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
  depth: string
  sample_set: Array<SampleSet>
  sampling_time: Date | null
}

export type TaskInfo = {
  id: number
  task_id: number
  calibration: string
  purging_time: string
  water_level: number
  pump_id: number
  pump_depth: number
  pump_freq: number
  pump_rate: number
  hose_setup: string
  sampling_time: string
  sample_wt_radium: number
  comment: string
}
