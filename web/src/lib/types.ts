export type Well = {
  id: number
  name: string
  type: string
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
  comment: string | null
}

export type TaskInfo = {
  id: number
  task_id: number
  calibration: string | null
  purging_time: Date | null
  water_level: number | null
  pump_id: number | null
  pump_depth: number | null
  pump_freq: number | null
  pump_rate: number | null
  hose_setup: string | null
  sampling_time: Date | null
  sample_wt_radium: number | null
  comment: string | null
}

export type InSituLog = {
  attr: object
  log_note: object[]
  log_data: object[]
}
