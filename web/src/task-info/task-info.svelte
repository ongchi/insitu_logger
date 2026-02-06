<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    selectedTask,
    selectedTaskInfo,
    sharedOptions,
  } from "$lib/shared-variables.svelte";
  import OptionSelector from "$lib/option-selector.svelte";
  import Editor from "$lib/editor/index.svelte";
  import TaskInfoEditMenu from "./edit-menu.svelte";
  import MultipleOptionSelector from "$lib/multiple-option-selector.svelte";
  import { Printer, ChevronDown, ChevronUp } from "@lucide/svelte";
  import { get_name as get_sample_name } from "$lib/sample-set-editor/sample-set-utils.ts";
  import jsPDF from "jspdf";
  import { NotoSansTC } from "$lib/NotoSansTC-Regular-normal.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import {
    localDateStringToISOString,
    dateToLocalString,
  } from "$lib/date-utils.ts";
  import { ApiClient } from "$lib/api-client";

  let row = $derived(selectedTask.length > 0 ? selectedTask[0] : null);
  let taskInfoList: { id: number; name: string }[] = $state([]);
  let selectedInfoId = $state(0);
  let selectedMinutedBy: string[] = $state([]);
  let selectedSampledBy: string[] = $state([]);
  let currentPumpDepth = $state("");
  let isCollapsed = $state(false);

  function toggleCollapse() {
    isCollapsed = !isCollapsed;
  }

  // Fetch task info id when row is selected
  function fetchTaskInfoIds(task_id: number) {
    ApiClient.get(
      `/api/task/${task_id}/info`,
      (data) => {
        taskInfoList = data.map((d: any) => {
          return { id: d.id, name: d.id };
        });
        selectedInfoId = taskInfoList.length > 0 ? taskInfoList[0].id : 0;
      },
      (_) => {
        taskInfoList = [];
        selectedInfoId = 0;
      },
    );
  }

  function fetchPeople(table: string, onSuccess: (data: any) => void) {
    ApiClient.get(
      `/api/task/${row?.id}/info/${selectedInfoId}/${table}`,
      onSuccess,
    );
  }

  function clearVars() {
    taskInfoList = [];
    selectedTaskInfo.pop();
    selectedInfoId = 0;
    currentPumpDepth = "";
    selectedMinutedBy = [];
    selectedSampledBy = [];
  }

  $effect(() => {
    if (row) {
      fetchTaskInfoIds(row.id);
    } else {
      clearVars();
    }
  });

  // Fetch task info when selectedInfoId changes
  $effect(() => {
    if (selectedInfoId !== 0 && row) {
      ApiClient.get(`/api/task/${row.id}/info`, (data) => {
        // Find the specific record matching selectedInfoId
        const selectedRecord = data.find((d: any) => d.id === selectedInfoId);

        if (selectedRecord) {
          let { purging_time, sampling_time, ...info } = selectedRecord;
          // Reassign array to trigger reactivity properly
          selectedTaskInfo[0] = {
            purging_time: purging_time ? new Date(purging_time) : null,
            sampling_time: sampling_time ? new Date(sampling_time) : null,
            ...info,
          };
          currentPumpDepth = findPumpDepth(selectedRecord.hose_setup);
          fetchPeople("minuted_by", (data) => {
            selectedMinutedBy = data.map((d: any) => d.people_id.toString());
          });
          fetchPeople("sampled_by", (data) => {
            selectedSampledBy = data.map((d: any) => d.people_id.toString());
          });
        }
      });
    } else {
      clearVars();
    }
  });

  function addTaskInfo() {
    if (row === null) {
      return;
    }
    let { id, ...newTaskInfo } =
      selectedTaskInfo.length === 0 ? { task_id: row.id } : selectedTaskInfo[0];
    ApiClient.put(`/api/task/${row.id}/info`, newTaskInfo, (_) =>
      fetchTaskInfoIds(row.id),
    );
  }

  function deleteTaskInfo() {
    if (row === null) {
      return;
    }
    ApiClient.delete(`/api/task/${row.id}/info/${selectedInfoId}`, (_) =>
      fetchTaskInfoIds(row.id),
    );
  }

  let updateTimeOut: ReturnType<typeof setTimeout>;
  function _updateTaskInfo(field: string, value: any) {
    if (field === "sampling_time" || field === "purging_time") {
      value = localDateStringToISOString(value);
    }
    value = value != null ? value : null;

    if (
      selectedTaskInfo.length > 0 &&
      (selectedTaskInfo[0] as any)[field] !== value
    ) {
      ApiClient.patch(
        `/api/task/${row?.id}/info/${selectedInfoId}`,
        { [field]: value },
        (_) => {
          let newValue = (() => {
            if (field === "sampling_time" || field === "purging_time") {
              return value ? new Date(value) : null;
            } else if (
              [
                "id",
                "task_id",
                "water_level",
                "pump_id",
                "pump_depth",
                "pump_freq",
                "pump_rate",
                "sample_wt_radium",
              ].some((e) => e === field)
            ) {
              return value ? parseFloat(value) : null;
            } else {
              return value;
            }
          })();
          (selectedTaskInfo[0] as any)[field] = newValue;
        },
      );
    }
  }

  function updateTaskInfo(ev: Event, field: string) {
    if (updateTimeOut) {
      clearTimeout(updateTimeOut);
    }
    updateTimeOut = setTimeout(() => {
      if (ev.target) {
        _updateTaskInfo(field, (ev.target as HTMLInputElement).value);
      }
    }, 300);
  }

  function findPumpDepth(hose_setup: string) {
    let regexNums = /(?<num>\d*(?:\.\d*)?)(?:(?:\s*[,+]\s*)?)+/g;

    let nums: number[] = [];
    if (hose_setup === null) return "";
    let match = hose_setup.matchAll(regexNums);
    if (match === null) return "";
    match.forEach((item) => {
      if (item.groups) {
        let n = parseFloat(item.groups.num);
        if (n) nums.push(n);
      }
    });

    let pumpDepth = parseFloat(selectedTask[0].depth);
    if (nums.reduce((acc, cur) => acc + cur, 0) < pumpDepth) {
      return "";
    }

    for (let i = nums.length - 1; i > 0; i--) {
      if (pumpDepth > nums[i]) {
        pumpDepth -= nums[i];
      } else {
        break;
      }
    }

    return pumpDepth.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  function addPeopleToList(table: string, people_id: string) {
    ApiClient.put(`/api/task/${row?.id}/info/${selectedInfoId}/${table}`, {
      id: parseInt(people_id),
    });
  }

  function removePeopleFromList(table: string, people_id: string) {
    ApiClient.delete(
      `/api/task/${row?.id}/info/${selectedInfoId}/${table}/${people_id}`,
    );
  }

  function printTags() {
    ApiClient.get(
      `/api/task/${selectedTaskInfo[0]?.task_id}/sample_set`,
      (data) => {
        let datetime = selectedTaskInfo[0].sampling_time;

        if (datetime === null) return;

        let well_type = sharedOptions.well.find(
          (w) => w.id == selectedTask[0].well_id,
        )?.type;

        let serial;
        if (well_type === "BLANK") {
          serial = "BLANK";
        } else {
          serial = `#${selectedTask[0].serial}`;
        }

        let well_depth;
        if (well_type === "BLANK") {
          well_depth = selectedTask[0].depth;
        } else {
          let conj;
          if (well_type === "SW") {
            conj = "_";
          } else {
            conj = "@";
          }
          well_depth = `${
            sharedOptions.well.find((w) => w.id == selectedTask[0].well_id)
              ?.name as string
          }${conj}${selectedTask[0].depth}`;
        }

        // Convert datetime to string with format YYYYMMDD HH:mm
        let datetime_str = `${datetime.getFullYear()}-${(
          "0" +
          (datetime.getMonth() + 1)
        ).slice(-2)}-${("0" + datetime.getDate()).slice(-2)} ${(
          "0" + datetime.getHours()
        ).slice(-2)}:${("0" + datetime.getMinutes()).slice(-2)}`;

        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: [42, 18],
        });
        doc.addFileToVFS("NotoSansTC-Regular-normal.ttf", NotoSansTC);
        doc.addFont("NotoSansTC-Regular-normal.ttf", "NotoSansTC", "normal");
        doc.setFont("NotoSansTC");
        doc.setFontSize(10);

        let pdfPages = 0;
        data.forEach((sample: { id: number; qty: number }) => {
          let name = get_sample_name(sample.id);
          if (sample.qty > 1) {
            for (let i = 1; i <= sample.qty; i++) {
              if (pdfPages > 0) {
                doc.addPage([42, 18]);
              }
              doc.text(serial, 4, 5.5);
              doc.text(well_depth, 4, 10.5);
              doc.text(datetime_str, 4, 15.5);
              doc.text(`${name} (${i})`, 22, 5.5);
              pdfPages++;
            }
          } else {
            if (pdfPages > 0) {
              doc.addPage([42, 18]);
            }
            doc.text(serial, 4, 5.5);
            doc.text(well_depth, 4, 10.5);
            doc.text(datetime_str, 4, 15.5);
            doc.text(name, 22, 5.5);
            pdfPages++;
          }
        });

        doc.output("dataurlnewwindow");
      },
    );
  }
</script>

<div class="w-full bg-white dark:bg-zinc-800">
  <!-- Header -->
  <div class="flex justify-between bg-white px-6 py-3 dark:bg-zinc-800">
    <button
      onclick={toggleCollapse}
      class="flex gap-2 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
      {#if isCollapsed}
        <ChevronDown class="h-4 w-4" />
      {:else}
        <ChevronUp class="h-4 w-4" />
      {/if}
      <h3 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Task Information
      </h3>
    </button>
    <div class="flex items-center gap-2">
      {#if taskInfoList.length > 0}
        <span class="text-sm text-zinc-500 dark:text-zinc-400">Record</span>
        <OptionSelector
          disabled={selectedTaskInfo.length === 0}
          bind:value={selectedInfoId}
          options={taskInfoList}
          allowDeselect={false}
        />
        <span class="text-sm text-zinc-500 dark:text-zinc-400">
          of {taskInfoList.length}
        </span>
      {/if}
      <TaskInfoEditMenu
        disabled={row === null}
        onAddTaskInfo={addTaskInfo}
        onDeleteTaskInfo={deleteTaskInfo}
      />
    </div>
  </div>

  <!-- Content -->
  {#if !isCollapsed}
    <div class="px-6 pb-6 transition-all duration-300">
      <div class="flex flex-col flex-wrap gap-2">
        <div class="flex flex-row flex-wrap gap-2">
          <div class="flex flex-col flex-wrap gap-2">
            <!-- Line 1 -->
            <div class="flex flex-row flex-wrap gap-2">
              <div class="grid max-w-[10em] gap-2">
                <Label for="calibration">Calibration</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="calibration"
                  type="string"
                  value={selectedTaskInfo[0]?.calibration}
                  onchange={(e) => {
                    updateTaskInfo(e, "calibration");
                  }}
                ></Input>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label>Minuted by</Label>
                <MultipleOptionSelector
                  disabled={selectedTaskInfo.length === 0}
                  bind:value={selectedMinutedBy}
                  options={sharedOptions.people}
                  addItem={(id: string) => addPeopleToList("minuted_by", id)}
                  deleteItem={(id: string) =>
                    removePeopleFromList("minuted_by", id)}
                ></MultipleOptionSelector>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label for="hose_setup">Hose Setup</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="hose_setup"
                  type="string"
                  value={selectedTaskInfo[0]?.hose_setup}
                  onchange={(e) => {
                    updateTaskInfo(e, "hose_setup");
                  }}
                  oninput={(e) => {
                    currentPumpDepth = findPumpDepth(
                      (e.target as HTMLInputElement).value,
                    );
                  }}
                  onkeypress={(e) => {
                    // prettier-ignore
                    let validKeys = [
                    "0", "1", "2", "3", "4",
                    "5", "6", "7", "8", "9",
                    ".", ",", "+", " ",
                  ];

                    if (!validKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                ></Input>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label for="auto_pump_depth">Pump Depth (m)</Label>
                <Input
                  readonly={true}
                  disabled={selectedTaskInfo.length === 0}
                  id="auto_pump_depth"
                  type="number"
                  value={currentPumpDepth}
                ></Input>
              </div>
            </div>

            <!-- Line 2 -->
            <div class="flex flex-row flex-wrap gap-2">
              <div class="grid max-w-[10em] gap-2">
                <Label for="water_level">Water Level (m)</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="water_level"
                  type="number"
                  value={selectedTaskInfo[0]?.water_level}
                  onchange={(e) => {
                    updateTaskInfo(e, "water_level");
                  }}
                ></Input>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label>Pump</Label>
                <OptionSelector
                  disabled={selectedTaskInfo.length === 0}
                  options={sharedOptions.pump}
                  value={selectedTaskInfo[0]?.pump_id!}
                  onValueChange={(value: any) => {
                    _updateTaskInfo("pump_id", value);
                  }}
                ></OptionSelector>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label for="pump_rate">Pump Rate (L/min)</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="pump_rate"
                  type="number"
                  value={selectedTaskInfo[0]?.pump_rate}
                  onchange={(e) => {
                    updateTaskInfo(e, "pump_rate");
                  }}
                ></Input>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label for="pump_frequency">Pump Frequency</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="pump_frequency"
                  type="number"
                  value={selectedTaskInfo[0]?.pump_freq}
                  onchange={(e) => {
                    updateTaskInfo(e, "pump_freq");
                  }}
                ></Input>
              </div>
            </div>

            <!-- Line 3 -->
            <div class="flex flex-row flex-wrap gap-2">
              <div class="grid max-w-[14em] gap-2">
                <Label for="purging_time">Purging Time</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="purging_time"
                  type="datetime-local"
                  value={dateToLocalString(selectedTaskInfo[0]?.purging_time)}
                  onclick={(e: MouseEvent) => {
                    try { (e.target as HTMLInputElement).showPicker(); } catch {}
                  }}
                  onchange={(e) => {
                    updateTaskInfo(e, "purging_time");
                  }}
                ></Input>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label>Sampled by</Label>
                <MultipleOptionSelector
                  disabled={selectedTaskInfo.length === 0}
                  bind:value={selectedSampledBy}
                  options={sharedOptions.people}
                  addItem={(id: string) => addPeopleToList("sampled_by", id)}
                  deleteItem={(id: string) =>
                    removePeopleFromList("sampled_by", id)}
                ></MultipleOptionSelector>
              </div>

              <div class="grid max-w-[14em] gap-2">
                <Label for="sampling_time">Sampling Time</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="sampling_time"
                  type="datetime-local"
                  value={dateToLocalString(selectedTaskInfo[0]?.sampling_time)}
                  onclick={(e: MouseEvent) => {
                    try { (e.target as HTMLInputElement).showPicker(); } catch {}
                  }}
                  onchange={(e) => {
                    updateTaskInfo(e, "sampling_time");
                  }}
                ></Input>
              </div>

              <div class="grid gap-2">
                <Label></Label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      class={buttonVariants({ variant: "ghost", size: "icon" })}
                      disabled={selectedTaskInfo.length === 0 ||
                        selectedTaskInfo[0]?.sampling_time === null}
                      onclick={printTags}
                    >
                      <Printer />
                    </Tooltip.Trigger>
                    <Tooltip.Content>Print Labels</Tooltip.Content>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div class="grid max-w-[10em] gap-2">
                <Label for="ra_weight">Ra Sample wt. (kg)</Label>
                <Input
                  disabled={selectedTaskInfo.length === 0}
                  id="ra_weight"
                  type="number"
                  value={selectedTaskInfo[0]?.sample_wt_radium}
                  onchange={(e) => {
                    updateTaskInfo(e, "sample_wt_radium");
                  }}
                ></Input>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="flex flex-col max-w-full gap-2">
            <Editor
              disabled={selectedTaskInfo.length === 0}
              value={selectedTaskInfo[0]?.comment === null
                ? ""
                : selectedTaskInfo[0]?.comment}
              onUpdate={(value: any) => {
                _updateTaskInfo("comment", value);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
