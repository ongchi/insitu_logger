<script lang="ts">
  import { type SampleSet } from "$lib/types.ts";
  import { sharedOptions, setS } from "$lib/shared-variables.svelte.ts";

  let { sample_set }: { sample_set: SampleSet[] } = $props();

  let get_name_by = (id: number) => {
    return sharedOptions.sample_type.find((s) => s.id === id)?.name!;
  };

  let get_id_by = (name: string) => {
    return sharedOptions.sample_type.find((s) => s.name === name)?.id!;
  };

  let extract = (set: SampleSet[], name: string) => {
    return set.find((item) => item.id === get_id_by(name));
  };

  let contains = (set: SampleSet[], name: string) => {
    return extract(set, name) !== undefined;
  };

  let get_simplified_set = (set: SampleSet[] | null) => {
    if (set === null) return [];

    // Check if the set is a subset of setS
    let set_s_label_list = Array.from(setS.map((s) => s.name));
    let is_set_s = set_s_label_list.reduce(
      (acc, cur) => acc && contains(set, cur),
      true,
    );

    // Check if the set is a subset of setL
    let so4_1l = extract(set, "SO4_1L");
    let so4_2l = extract(set, "SO4_2L");
    let so4_5l = extract(set, "SO4_5L");
    let has_so4 =
      so4_1l !== undefined || so4_2l !== undefined || so4_5l !== undefined;

    let vaccum_vessel = extract(set, "真空瓶");
    let has_vaccum = vaccum_vessel !== undefined;

    let serum_bottle_250 = extract(set, "血清瓶_250mL");
    let serum_bottle_160 = extract(set, "血清瓶_160mL");
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
      if (contains(set, "H3")) {
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
      if (contains(set, "H3")) {
        simplified_set.push("小氚福");
      } else {
        simplified_set.push("小福");
      }
      set.forEach((s) => {
        let s_label = get_name_by(s.id);
        if (s_label !== "H3" && !set_s_label_list.includes(s_label)) {
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

  let simplified_sample_set = get_simplified_set(sample_set);
</script>

<div class="flex flex-wrap flex-row space-x-1">
  {#each simplified_sample_set as sample}
    <div class="flex flex-nowrap flex-row m-1">
      {#if typeof sample === "string"}
        <span class="text-nowrap border rounded my-1 px-2">{sample}</span>
      {:else}
        <span class="text-nowrap border rounded-l my-1 pl-2 pr-1"
          >{get_name_by(sample.id)}</span
        >
        <span
          class="border rounded-r my-1 px-1 bg-primary/50 text-primary-foreground"
        >
          {sample.qty}
        </span>
      {/if}
    </div>
  {/each}
</div>
