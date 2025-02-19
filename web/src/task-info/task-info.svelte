<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    selectedTask,
    selectedTaskInfo,
    pgClient,
    sharedOptions,
  } from "$lib/shared-variables.svelte";
  import OptionSelector from "$lib/option-selector.svelte";
  import Editor from "$lib/editor/index.svelte";
  import { toast } from "svelte-sonner";
  import TaskInfoEditMenu from "./edit-menu.svelte";
  import MultipleOptionSelector from "$lib/multiple-option-selector.svelte";
  import { Printer } from "lucide-svelte";
  import { get_name as get_sample_name } from "../task-table/sample-set-utils.ts";
  import jsPDF from "jspdf";
  import { NotoSansTC } from "$lib/NotoSansTC-Regular-normal.js";
  import { buttonVariants } from "$lib/components/ui/button/index.js";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";

  let row = $derived(selectedTask.length > 0 ? selectedTask[0] : null);
  let taskInfoList: any[] = $state([]);
  let selectedInfoId = $state(0);
  let selectedMinutedBy: string[] = $state([]);
  let selectedSampledBy: string[] = $state([]);
  let currentPumpDepth = $state("");

  // Fetch task info id when row is selected
  function fetchTaskInfo(id: number) {
    pgClient
      .from("task_info")
      .select("id")
      .order("id", { ascending: false })
      .eq("task_id", id)
      .then(({ data, error }) => {
        if (error) {
          taskInfoList = [];
          selectedInfoId = 0;
        } else {
          taskInfoList = data.map((d) => {
            return { id: d.id, name: d.id };
          });
          selectedInfoId = taskInfoList.length > 0 ? taskInfoList[0].id : 0;
        }
      });
  }

  function fetchPeople(
    table: string,
    id: number,
    callback: (data: any) => void,
  ) {
    pgClient
      .from(table)
      .select("people_id")
      .order("people_id", { ascending: true })
      .eq("task_info_id", id)
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          callback(data);
        }
      });
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
      fetchTaskInfo(row.id);
    } else {
      clearVars();
    }
  });

  // Fetch task info when selectedInfoId changes
  $effect(() => {
    if (selectedInfoId !== 0) {
      pgClient
        .from("task_info")
        .select("*")
        .eq("id", selectedInfoId)
        .then(({ data, error }) => {
          if (error) {
            clearVars();
          } else {
            selectedTaskInfo.pop();
            selectedTaskInfo.push(data[0]);
            currentPumpDepth = findPumpDepth(data[0].hose_setup);
            fetchPeople("task_minuted_by", selectedInfoId, (data) => {
              selectedMinutedBy = data.map((d: any) => d.people_id.toString());
            });
            fetchPeople("task_sampled_by", selectedInfoId, (data) => {
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
    pgClient
      .from("task_info")
      .insert(newTaskInfo)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          fetchTaskInfo(row.id);
        }
      });
  }

  function deleteTaskInfo() {
    if (row === null) {
      return;
    }
    pgClient
      .from("task_info")
      .delete()
      .eq("id", selectedInfoId)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          fetchTaskInfo(row.id);
        }
      });
  }

  let updateTimeOut: number;
  function _updateTaskInfo(field: string, value: any) {
    if (
      selectedTaskInfo.length > 0 &&
      (selectedTaskInfo[0] as any)[field] != value
    ) {
      pgClient
        .from("task_info")
        .update({ [field]: value == "" ? null : value })
        .eq("id", selectedInfoId)
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            (selectedTaskInfo[0] as any)[field] = value;
          }
        });
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
    pgClient
      .from(table)
      .insert({ task_info_id: selectedInfoId, people_id })
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
        }
      });
  }

  function removePeopleFromList(table: string, people_id: string) {
    pgClient
      .from(table)
      .delete()
      .eq("task_info_id", selectedInfoId)
      .eq("people_id", people_id)
      .then(({ error }) => {
        if (error) {
          toast.error(error.message);
        }
      });
  }

  function printTags() {
    pgClient
      .from("sample_set")
      .select("sample_type_id,qty")
      .order("sample_type_id", { ascending: true })
      .eq("task_id", selectedTaskInfo[0]?.task_id)
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message);
        } else {
          let serial = `#${selectedTask[0].serial}`;
          let well_type = sharedOptions.well.find(
            (w) => w.id == selectedTask[0].well_id,
          )?.type;

          let conj;
          if (well_type === "SW") {
            conj = "_";
          } else {
            conj = "@";
          }

          let well_depth = `${
            sharedOptions.well.find((w) => w.id == selectedTask[0].well_id)
              ?.name as string
          }${conj}${selectedTask[0].depth}`;

          let datetime = new Date(selectedTaskInfo[0].sampling_time);

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
          data.forEach((sample: { sample_type_id: number; qty: number }) => {
            let name = get_sample_name(sample.sample_type_id);
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
        }
      });
  }
</script>

<div class="w-full px-2 pb-2">
  <div class="border rounded-xl p-4">
    <div class="flex flex-col flex-wrap gap-2">
      <div class="flex flex-row flex-wrap gap-2">
        <div class="flex flex-col flex-wrap gap-2">
          <!-- Line 1 -->
          <div class="flex flex-row flex-wrap gap-2">
            <div class="grid min-w-min gap-2">
              <Label
                >Record ({taskInfoList
                  .map((info) => info.id)
                  .indexOf(selectedInfoId) + 1}/{taskInfoList.length})</Label
              >
              <div class="flex flex-row gap-2">
                <OptionSelector
                  disabled={row === null}
                  bind:value={selectedInfoId}
                  options={taskInfoList}
                  allowDeselect={false}
                ></OptionSelector>
                <TaskInfoEditMenu
                  disabled={row === null}
                  onAddTaskInfo={addTaskInfo}
                  onDeleteTaskInfo={deleteTaskInfo}
                />
              </div>
            </div>

            <div class="grid min-w-40 items-center gap-2">
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

            <div class="grid min-w-[12em] gap-2">
              <Label>Minuted by</Label>
              <MultipleOptionSelector
                disabled={row === null}
                bind:value={selectedMinutedBy}
                options={sharedOptions.people}
                addItem={(id: string) => addPeopleToList("task_minuted_by", id)}
                deleteItem={(id: string) =>
                  removePeopleFromList("task_minuted_by", id)}
              ></MultipleOptionSelector>
            </div>

            <div class="grid min-w-32 items-center gap-2">
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

            <div class="grid min-w-32 items-center gap-2">
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
            <div class="grid min-w-32 items-center gap-2">
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

            <div class="grid min-w-32 items-center gap-2">
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

            <div class="grid min-w-32 items-center gap-2">
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

            <div class="grid min-w-32 items-center gap-2">
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
            <div class="grid min-w-32 items-center gap-2">
              <Label for="purging_time">Purging Time</Label>
              <Input
                disabled={selectedTaskInfo.length === 0}
                id="purging_time"
                type="datetime-local"
                value={selectedTaskInfo[0]?.purging_time}
                onchange={(e) => {
                  updateTaskInfo(e, "purging_time");
                }}
              ></Input>
            </div>

            <div class="grid min-w-[12em] items-center gap-2">
              <Label>Sampled by</Label>
              <MultipleOptionSelector
                disabled={row === null}
                bind:value={selectedSampledBy}
                options={sharedOptions.people}
                addItem={(id: string) => addPeopleToList("task_sampled_by", id)}
                deleteItem={(id: string) =>
                  removePeopleFromList("task_sampled_by", id)}
              ></MultipleOptionSelector>
            </div>

            <div class="grid min-w-32 items-center gap-2">
              <Label for="sampling_time">Sampling Time</Label>
              <Input
                disabled={selectedTaskInfo.length === 0}
                id="sampling_time"
                type="datetime-local"
                value={selectedTaskInfo[0]?.sampling_time}
                onchange={(e) => {
                  updateTaskInfo(e, "sampling_time");
                }}
              ></Input>
            </div>

            <div class="grid items-center gap-2">
              <Label></Label>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger
                    class={buttonVariants({ variant: "ghost", size: "icon" })}
                    disabled={row === null}
                    onclick={printTags}
                  >
                    <Printer />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Print Labels</Tooltip.Content>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>

            <div class="grid min-w-32 items-center gap-2">
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
</div>
