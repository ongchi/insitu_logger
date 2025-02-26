import { type SampleSet } from "$lib/types.ts";
import { sharedOptions, setS } from "$lib/shared-variables.svelte.ts";

export function get_name(id: number) {
  return sharedOptions.sample_type.find((s) => s.id === id)?.name!;
};

export function get_fullname(id: number) {
  let _type = sharedOptions.sample_type.find(s => s.id === id);
  let fullname = _type?.name;

  if (_type?.variant) fullname += ` ${_type?.variant}`;

  return fullname
}

export function get_id(name: string) {
  return sharedOptions.sample_type.find((s) => s.name === name)?.id!;
};

let extract = (set: SampleSet[], name: string) => {
  return set.find((item) => item.id === get_id(name));
};

let contains = (set: SampleSet[], name: string) => {
  return extract(set, name) !== undefined;
};

export function get_simplified_set(set: SampleSet[] | null) {
  if (set === null) return [];

  // Check if the set is a subset of setS
  let set_s_label_list = Array.from(setS.map((s) => s.name));
  let is_set_s = set_s_label_list.reduce(
    (acc, cur) => acc && contains(set, cur),
    true,
  );

  // Check if the set is a subset of setL
  let so4_1l = extract(set, "SO4 1L");
  let so4_2l = extract(set, "SO4 2L");
  let so4_5l = extract(set, "SO4 5L");
  let has_so4 =
    so4_1l !== undefined || so4_2l !== undefined || so4_5l !== undefined;

  let vaccum_vessel = extract(set, "真空瓶");
  let has_vaccum = vaccum_vessel !== undefined;

  let serum_bottle_250 = extract(set, "血清瓶");
  let serum_bottle_160 = extract(set, "血清瓶 160mL");
  let has_serum =
    serum_bottle_250 != undefined || serum_bottle_160 !== undefined;

  let is_set_l =
    is_set_s &&
    contains(set, "HO") &&
    contains(set, "DIC") &&
    has_so4 &&
    has_vaccum &&
    has_serum;

  let simplified_set: (string | SampleSet)[] = [];
  if (is_set_l) {
    if (contains(set, "H-3")) {
      simplified_set.push("大氚福");
    } else {
      simplified_set.push("大福");
    }
    if (so4_1l) simplified_set.push(so4_1l);
    if (so4_2l) simplified_set.push(so4_2l);
    if (so4_5l) simplified_set.push(so4_5l);
    if (vaccum_vessel) simplified_set.push(vaccum_vessel);
    if (serum_bottle_250) simplified_set.push(serum_bottle_250);
    if (serum_bottle_160) simplified_set.push(serum_bottle_160);
  } else if (is_set_s) {
    if (contains(set, "H-3")) {
      simplified_set.push("小氚福");
    } else {
      simplified_set.push("小福");
    }
    set.forEach((s) => {
      let s_label = get_name(s.id);
      if (s_label !== "H-3" && !set_s_label_list.includes(s_label)) {
        simplified_set.push(s);
      }
    });
  } else {
    set.forEach((s) => {
      simplified_set.push(s);
    });
  }

  return simplified_set;
};
