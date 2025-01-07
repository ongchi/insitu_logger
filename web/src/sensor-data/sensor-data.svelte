<script lang="ts">
  import { selectedTaskInfo } from "$lib/shared-variables.svelte";

  let baseUrl = "http://localhost:80/troll_sensor_data/";

  let iframeSrc = $state(baseUrl);

  $effect(() => {
    if (selectedTaskInfo.length > 0) {
      let src = `${baseUrl}?task_id=${selectedTaskInfo[0]?.task_id}`;
      if (selectedTaskInfo[0]?.purging_time) {
        src += `&st=${selectedTaskInfo[0]?.purging_time}`;
      }
      if (selectedTaskInfo[0]?.sampling_time) {
        src += `&ed=${selectedTaskInfo[0]?.sampling_time}`;
      }
      iframeSrc = src;
    }
  });
</script>

{#if selectedTaskInfo.length > 0}
  <div class="w-full px-2">
    <iframe src={iframeSrc} title="Plotting" class="w-full h-[85em]"></iframe>
  </div>
{/if}
