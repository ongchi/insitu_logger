<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    selectedRow,
    pgClient,
    sharedOptions,
  } from "$lib/shared-variables.svelte";
  import OptionSelector from "$lib/option-selector.svelte";
  import Editor from "$lib/editor/index.svelte";
  import { toast } from "svelte-sonner";
  import TaskInfoEditMenu from "./edit-menu.svelte";
  import MultipleOptionSelector from "$lib/multiple-option-selector.svelte";

  type TaskInfo = {
    id: number;
    task_id: number;
    calibration: string;
    purging_time: string;
    water_level: number;
    pump_id: number;
    pump_depth: number;
    pump_freq: number;
    pump_rate: number;
    hose_setup: string;
    sampling_time: string;
    sample_wt_radium: number;
    comment: string;
  };

  let row = $derived(selectedRow.length > 0 ? selectedRow[0] : null);
  let taskInfoList: any[] = $state([]);
  let selectedInfoId = $state(0);
  let selectedInfo: TaskInfo | null = $state(null);
  let selectedMinutedBy: string[] = $state([]);
  let selectedSampledBy: string[] = $state([]);

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
    selectedInfo = null;
    selectedInfoId = 0;
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
            selectedInfo = data[0];
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
      selectedInfo === null ? { task_id: row.id } : selectedInfo;
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
    if (selectedInfo && (selectedInfo as any)[field] !== value) {
      pgClient
        .from("task_info")
        .update({ [field]: value === "" ? null : value })
        .eq("id", selectedInfoId)
        .then(({ error }) => {
          if (error) {
            toast.error(error.message);
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
</script>

<div class="w-full px-2 pb-2">
  <div class="border rounded-xl p-4">
    <div class="flex flex-col flex-wrap gap-2">
      <div class="flex gap-2">
        <div class="grid w-full max-w-min gap-2">
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
        <div class="grid w-full max-w-xs gap-2">
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
        <div class="grid w-full max-w-xs gap-2">
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
      </div>

      <div class="flex flex-row flex-wrap gap-2">
        <div class="flex flex-col flex-wrap gap-2">
          <div class="flex flex-row flex-wrap gap-2">
            <div class="grid w-full max-w-min max-w-36 items-center gap-2">
              <Label for="purging_time">Purging Time</Label>
              <Input
                disabled={selectedInfo === null}
                id="purging_time"
                type="datetime-local"
                value={selectedInfo?.purging_time}
                onchange={(e) => {
                  updateTaskInfo(e, "purging_time");
                }}
              ></Input>
            </div>
            <div class="grid w-full max-w-40 items-center gap-2">
              <Label for="calibration">Calibration</Label>
              <Input
                disabled={selectedInfo === null}
                id="calibration"
                type="string"
                value={selectedInfo?.calibration}
                onchange={(e) => {
                  updateTaskInfo(e, "calibration");
                }}
              ></Input>
            </div>
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <div class="grid w-full max-w-min items-center gap-2">
              <Label>Pump</Label>
              <OptionSelector
                disabled={selectedInfo === null}
                options={sharedOptions.pump}
                value={selectedInfo?.pump_id!}
                onValueChange={(value: any) => {
                  _updateTaskInfo("pump_id", value);
                }}
              ></OptionSelector>
            </div>
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="water_level">Water Level (m)</Label>
              <Input
                disabled={selectedInfo === null}
                id="water_level"
                type="number"
                value={selectedInfo?.water_level}
                onchange={(e) => {
                  updateTaskInfo(e, "water_level");
                }}
              ></Input>
            </div>
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="pump_rate">Pump Rate (L/min)</Label>
              <Input
                disabled={selectedInfo === null}
                id="pump_rate"
                type="number"
                value={selectedInfo?.pump_rate}
                onchange={(e) => {
                  updateTaskInfo(e, "pump_rate");
                }}
              ></Input>
            </div>
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="hose_setup">Hose Setup</Label>
              <Input
                disabled={selectedInfo === null}
                id="hose_setup"
                type="string"
                value={selectedInfo?.hose_setup}
                onchange={(e) => {
                  updateTaskInfo(e, "hose_setup");
                }}
              ></Input>
            </div>
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="pump_depth">Pump Depth (m)</Label>
              <Input
                disabled={selectedInfo === null}
                id="pump_depth"
                type="number"
                value={selectedInfo?.pump_depth}
                onchange={(e) => {
                  updateTaskInfo(e, "pump_depth");
                }}
              ></Input>
            </div>
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="pump_frequency">Pump Frequency</Label>
              <Input
                disabled={selectedInfo === null}
                id="pump_frequency"
                type="number"
                value={selectedInfo?.pump_freq}
                onchange={(e) => {
                  updateTaskInfo(e, "pump_freq");
                }}
              ></Input>
            </div>
          </div>
          <div class="flex flex-row flex-wrap gap-2">
            <div class="grid w-full max-w-min items-center gap-2">
              <Label for="sampling_time">Sampling Time</Label>
              <Input
                disabled={selectedInfo === null}
                id="sampling_time"
                type="datetime-local"
                value={selectedInfo?.sampling_time}
                onchange={(e) => {
                  updateTaskInfo(e, "sampling_time");
                }}
              ></Input>
            </div>
            <div class="grid w-full max-w-32 items-center gap-2">
              <Label for="ra_weight">Ra Sample wt. (kg)</Label>
              <Input
                disabled={selectedInfo === null}
                id="ra_weight"
                type="number"
                value={selectedInfo?.sample_wt_radium}
                onchange={(e) => {
                  updateTaskInfo(e, "sample_wt_radium");
                }}
              ></Input>
            </div>
          </div>
        </div>
        <div class="flex flex-col flex-wrap gap-2">
          <div class="grid w-full max-w-sm items-center gap-2">
            <Label>Comment</Label>
            <div class="flex flex-col items-center gap-2">
              <Editor
                disabled={selectedInfo === null}
                value={selectedInfo?.comment === null
                  ? ""
                  : selectedInfo?.comment}
                onUpdate={(value: any) => {
                  _updateTaskInfo("comment", value);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
