<script lang="ts">
  import { type SampleSet } from "$lib/types.ts";
  import { Input } from "$lib/components/ui/input";
  import OptionSelector from "$lib/option-selector.svelte";
  import { ApiClient } from "$lib/api-client";
  import SampleSetEditor from "$lib/sample-set-editor/sample-set-editor.svelte";

  import { selectedTask, sharedOptions } from "$lib/shared-variables.svelte";

  let updateTimeOut: number;
  function _updateTask(field: string, value: any) {
    value = value != null ? value : null;

    if (selectedTask.length > 0 && (selectedTask[0] as any)[field] !== value) {
      ApiClient.patch(
        `/api/task/${selectedTask[0]?.id}`,
        { [field]: value },
        (_) => {
          let newValue = (() => {
            return value;
          })();
          (selectedTask[0] as any)[field] = newValue;
        },
      );
    }
  }

  function updateTask(ev: Event, field: string) {
    if (updateTimeOut) {
      clearTimeout(updateTimeOut);
    }
    updateTimeOut = setTimeout(() => {
      if (ev.target) {
        _updateTask(field, (ev.target as HTMLInputElement).value);
      }
    }, 300);
  }
</script>

<div class="ml-4 flex-1">
  <h2
    class="flex flex-row items-center font-semibold text-zinc-900 dark:text-zinc-100 gap-2"
  >
    <div class="grid max-w-[8em] gap-2">
      <Input
        type="string"
        value={selectedTask[0]?.serial}
        onchange={(e) => {
          updateTask(e, "serial");
        }}
        placeholder="Serial"
      ></Input>
    </div>

    <div class="grid max-w-[8em] gap-2">
      <OptionSelector
        options={sharedOptions.well}
        value={selectedTask[0]?.well_id!}
        onValueChange={(value: any) => {
          _updateTask("well_id", value);
        }}
      ></OptionSelector>
    </div>

    <span>@</span>

    <div class="grid max-w-[8em] gap-2">
      <Input
        type="string"
        value={selectedTask[0]?.depth}
        onchange={(e) => {
          updateTask(e, "depth");
        }}
        placeholder="Depth"
      ></Input>
    </div>

    <div class="grid gap-2">
      <SampleSetEditor
        initialSet={selectedTask[0]?.sample_set}
        onSave={(newValue: SampleSet[]) => {
          let updateItems = [...newValue];

          // Items not in the original sample set
          selectedTask[0]?.sample_set.forEach((oldItem) => {
            let maybeDelete = newValue.find(
              (newItem) => newItem.id == oldItem.id,
            );
            if (maybeDelete === undefined)
              updateItems.push({ id: oldItem.id, qty: 0 });
          });

          return ApiClient.patch(
            `/api/task/${selectedTask[0]?.id}/sample_set`,
            updateItems,
            (_) => {
              selectedTask[0].sample_set = [...newValue];
              return true;
            },
            (_) => false,
          );
        }}
      />
    </div>
  </h2>
</div>
