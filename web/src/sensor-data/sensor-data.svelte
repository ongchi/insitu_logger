<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { pgClient, selectedTaskInfo } from "$lib/shared-variables.svelte";
  import { toast } from "svelte-sonner";

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
  <div class="flex w-full">
    <div class="flex px-2 ml-auto">
      <Button
        variant="destructive"
        size="sm"
        onclick={() => {
          pgClient
            .from("sensor_data")
            .delete()
            .eq("task_id", selectedTaskInfo[0]?.task_id)
            .then(({ error }) => {
              if (error) {
                toast.error(error.message);
              } else {
                toast.success("Data cleared");
                let iframe = document.getElementById(
                  "plot",
                ) as HTMLIFrameElement;
                iframe.src = iframe.src;
              }
            });
        }}>Clear</Button
      >
    </div>
  </div>
  <div class="w-full px-2">
    <iframe id="plot" src={iframeSrc} title="Plotting" class="w-full h-[85em]"
    ></iframe>
  </div>
{/if}
