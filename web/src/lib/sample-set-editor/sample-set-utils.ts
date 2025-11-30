import { type SampleSet } from '$lib/types.ts'
import { sharedOptions } from '$lib/shared-variables.svelte.ts'

export const preset = [
  {
    name: '大氚福',
    content: [
      { id: 1, name: 'Trace', variant: null, qty: 1, hidden: true },
      { id: 2, name: 'IC', variant: null, qty: 2, hidden: true },
      { id: 3, name: 'DOC', variant: null, qty: 2, hidden: true },
      { id: 5, name: 'ALK', variant: null, qty: 1, hidden: true },
      { id: 6, name: 'HO', variant: null, qty: 3, hidden: true },
      { id: 7, name: 'DIC', variant: null, qty: 4, hidden: true },
      { id: 8, name: 'HS-', variant: null, qty: 2, hidden: true },
      { id: 9, name: 'I-', variant: null, qty: 2, hidden: true },
      { id: 10, name: 'Ra', variant: null, qty: 1, hidden: true },
      { id: 11, name: 'Sr Isotope', variant: null, qty: 1, hidden: true },
      { id: 14, name: 'SO4', variant: '5L', qty: 1, hidden: false },
      { id: 15, name: 'H-3', variant: null, qty: 1, hidden: true },
      { id: 16, name: '真空瓶', variant: null, qty: 1, hidden: false },
      { id: 17, name: '血清瓶', variant: '250mL', qty: 2, hidden: false },
    ],
  },
  {
    name: '大福',
    content: [
      { id: 1, name: 'Trace', variant: null, qty: 1, hidden: true },
      { id: 2, name: 'IC', variant: null, qty: 2, hidden: true },
      { id: 3, name: 'DOC', variant: null, qty: 2, hidden: true },
      { id: 5, name: 'ALK', variant: null, qty: 1, hidden: true },
      { id: 6, name: 'HO', variant: null, qty: 3, hidden: true },
      { id: 7, name: 'DIC', variant: null, qty: 4, hidden: true },
      { id: 8, name: 'HS-', variant: null, qty: 2, hidden: true },
      { id: 9, name: 'I-', variant: null, qty: 2, hidden: true },
      { id: 10, name: 'Ra', variant: null, qty: 1, hidden: true },
      { id: 11, name: 'Sr Isotope', variant: null, qty: 1, hidden: true },
      { id: 14, name: 'SO4', variant: '5L', qty: 1, hidden: false },
      { id: 16, name: '真空瓶', variant: null, qty: 1, hidden: false },
      { id: 17, name: '血清瓶', variant: '250mL', qty: 2, hidden: false },
    ],
  },
  {
    name: '小氚福',
    content: [
      { id: 1, name: 'Trace', variant: null, qty: 1, hidden: true },
      { id: 2, name: 'IC', variant: null, qty: 1, hidden: true },
      { id: 3, name: 'DOC', variant: null, qty: 2, hidden: true },
      { id: 5, name: 'ALK', variant: null, qty: 1, hidden: true },
      { id: 8, name: 'HS-', variant: null, qty: 2, hidden: true },
      { id: 9, name: 'I-', variant: null, qty: 2, hidden: true },
      { id: 10, name: 'Ra', variant: null, qty: 1, hidden: true },
      { id: 15, name: 'H-3', variant: null, qty: 1, hidden: true },
    ],
  },
  {
    name: '小福',
    content: [
      { id: 1, name: 'Trace', variant: null, qty: 1, hidden: true },
      { id: 2, name: 'IC', variant: null, qty: 1, hidden: true },
      { id: 3, name: 'DOC', variant: null, qty: 2, hidden: true },
      { id: 5, name: 'ALK', variant: null, qty: 1, hidden: true },
      { id: 8, name: 'HS-', variant: null, qty: 2, hidden: true },
      { id: 9, name: 'I-', variant: null, qty: 2, hidden: true },
      { id: 10, name: 'Ra', variant: null, qty: 1, hidden: true },
    ],
  },
  {
    name: '空白',
    content: [
      { id: 1, name: 'Trace', variant: null, qty: 1, hidden: true },
      { id: 2, name: 'IC', variant: null, qty: 1, hidden: true },
      { id: 9, name: 'I-', variant: null, qty: 1, hidden: true },
    ],
  },
]

export function get_name(id: number) {
  return sharedOptions.sample_type.find((s) => s.id === id)?.name!
}

export function get_fullname(id: number) {
  let _type = sharedOptions.sample_type.find((s) => s.id === id)
  let fullname = _type?.name

  if (_type?.variant) fullname += ` ${_type?.variant}`

  return fullname
}

export function get_id(name: string) {
  return sharedOptions.sample_type.find((s) => s.name === name)?.id!
}

export function get_simplified_set(current_set: SampleSet[] | null) {
  if (current_set === null) return []

  let simplified_set: (string | SampleSet)[] = []

  for (let _preset of preset) {
    let match_set = _preset.content
      .map((s) => {
        return { name: s.name, qty: s.qty }
      })
      .reduce(
        (acc, test_set) =>
          acc &&
          current_set.find(
            (set) =>
              get_name(set.id) === test_set.name && set.qty >= test_set.qty
          ) !== undefined,
        true
      )
    if (match_set) {
      simplified_set.push(_preset.name)
      current_set
        .filter((set) => {
          if (
            _preset.content.find(
              (test_set) => get_name(set.id) === test_set.name
            ) === undefined
          ) {
            return true
          } else {
            return (
              _preset.content.find(
                (test_set) =>
                  get_name(set.id) === test_set.name &&
                  (set.qty !== test_set.qty || !test_set.hidden)
              ) !== undefined
            )
          }
        })
        .forEach((s) => {
          simplified_set.push(s)
        })
      break
    }
  }

  return simplified_set
}
