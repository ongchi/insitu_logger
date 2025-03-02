<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import LogEditMenu from "./log-edit-menu.svelte";
  import { selectedTaskInfo } from "$lib/shared-variables.svelte";
  import { toast } from "svelte-sonner";
  import { ColumnDataSource } from "@bokeh/bokehjs";
  import {
    Figure,
    figure,
    show,
    gridplot,
  } from "@bokeh/bokehjs/build/js/lib/api/plotting";
  import { BoxAnnotation, HoverTool } from "@bokeh/bokehjs/build/js/lib/models";
  import {
    criteria,
    create_annotation_bounds,
    test_sampling_dataframe,
  } from "./test_function.ts";
  import { insitu_log_handler } from "./sensor-log-handler.ts";
  import { type InSituLog } from "$lib/types.ts";
  import { dateToISOString } from "$lib/utils.ts";
  import { ApiClient } from "$lib/api-client";

  // Local datetime hack for BokehJS
  let LOCAL_TIME_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;

  let SQL_TO_FULL_COLUMN_NAME: { [id: string]: string } = {
    datetime: "Date and Time",
    cndct: "Actual Conductivity (µS/cm)",
    temp_internal: "Temperature (C)",
    spcndct: "Specific Conductivity (µS/cm)",
    sa: "Salinity (PSU)",
    resis: "Resistivity (ohm-cm)",
    wtr_d: "Water Density (g/cm3)",
    tds: "Total Dissolved Solids (ppm)",
    turbidity: "Turbidity (NTU)",
    ph: "pH (pH)",
    ph_mv: "pH(mV) (mV)",
    orp: "Oxidation Reduction Potential (ORP) (mV)",
    do_con: "Dissolved Oxygen (concentration) (mg/L)",
    do_sat: "Dissolved Oxygen (%saturation) (%Sat)",
    ppo2: "Partial Pressure Oxygen (Torr)",
    temp_sensor: "Temperature (C).1",
    v: "External Voltage (V)",
    batt: "Battery Percentage (%)",
    pres_baro: "Barometric Pressure (PSI)",
    pres: "Pressure (PSI)",
    depth: "Depth (m)",
  };
  let columns = Object.keys(SQL_TO_FULL_COLUMN_NAME);
  let source = $state(new ColumnDataSource({ data: {} }));

  let plots: Figure[] = $state([]);
  let purgingTime = $derived(
    (() => {
      let purgingTimeStr = selectedTaskInfo[0]?.purging_time;
      // Local datetime hack for BokehJS
      return purgingTimeStr
        ? purgingTimeStr.getTime() - LOCAL_TIME_OFFSET
        : null;
    })(),
  );
  let samplingTime = $derived(
    (() => {
      let samplingTimeStr = selectedTaskInfo[0]?.sampling_time;
      // Local datetime hack for BokehJS
      return samplingTimeStr
        ? samplingTimeStr.getTime() - LOCAL_TIME_OFFSET
        : null;
    })(),
  );

  let logFileInput: any = $state();

  $effect(() => {
    if (selectedTaskInfo.length > 0) {
      clearPlot();
      let currentTaskId = selectedTaskInfo[0]?.task_id;
      ApiClient.get(`/api/task/${currentTaskId}/sensor`, (data) => {
        if (data.length > 0) {
          source = createColumnDataSource(data);
          createGridPlot(source);
        }
      });
    }
  });

  function clearPlot() {
    let plotDiv = document.getElementById("bokehjs-plot");
    if (plotDiv) plotDiv.innerHTML = "";
  }

  function createColumnDataSource(data: any) {
    let transformedData: any = {};
    columns.forEach((key) => {
      if (key === "datetime") {
        let datetime: number[] = data.map((d: any) =>
          Date.parse(d["datetime"]),
        );
        let timestamp = datetime.map((d) => new Date(d).toString());
        // Local datetime hack for BokehJS
        transformedData["datetime"] = datetime.map(
          (d: number) => d - LOCAL_TIME_OFFSET,
        );
        transformedData["timestamp"] = timestamp;
      } else {
        transformedData[key] = data.map((d: any) => d[key]);
      }
    });
    return new ColumnDataSource({
      data: transformedData,
    });
  }

  function createGridPlot(data_source: ColumnDataSource) {
    plots = columns
      .filter((k) => k !== "datetime")
      .map((key) => {
        const hover = new HoverTool({
          tooltips: [
            ["time", "@timestamp"],
            [key, `@{${key}}{0.0000}`],
          ],
          mode: "vline",
        });

        const plot = figure({
          title: criteria[key]
            ? `${SQL_TO_FULL_COLUMN_NAME[key]} (±${criteria[key]})`
            : SQL_TO_FULL_COLUMN_NAME[key],
          sizing_mode: "stretch_width",
          height: 300,
          x_axis_type: "datetime",
        });
        plot.add_tools(hover);

        hover.renderers = [
          plot.line(
            { field: "datetime" },
            { field: key },
            { source: data_source, line_width: 2 },
          ),
        ];

        return plot;
      });

    // Link x_range of all plots
    plots.forEach((p) => {
      p.x_range = plots[0].x_range;
    });

    let grid = gridplot(plots, { sizing_mode: "stretch_width", ncols: 4 });
    show(grid, "#bokehjs-plot");

    if (purgingTime) {
      plots.forEach((p) => {
        p.vspan(purgingTime, { line_width: 1, line_color: "green" });
        p.vspan(purgingTime + 1 * 3600 * 1000, {
          line_width: 1,
          line_color: "gray",
        });
      });
    }

    if (samplingTime) {
      plots.forEach((p) =>
        p.vspan(samplingTime, { line_width: 1, line_color: "red" }),
      );
    }

    if (purgingTime) {
      let test_result = test_sampling_dataframe(
        data_source.data as any,
        5 * 60 * 1000,
      );
      let annotation_bounds = create_annotation_bounds(
        test_result,
        purgingTime,
      );
      columns.forEach((key, idx) => {
        if (key in annotation_bounds && annotation_bounds[key].length > 0) {
          annotation_bounds[key].forEach((bounds) => {
            plots[idx - 1].add_layout(
              new BoxAnnotation({
                left: bounds[0],
                right: bounds[1],
                fill_color: "#D55E00",
                propagate_hover: true,
              }),
            );
          });
        }
      });
    }
  }

  function onLogFileChanged(ev: Event) {
    let file = (ev.target as HTMLInputElement).files?.[0];
    if (file) {
      let form = new FormData();
      form.append("log", file);
      ApiClient.post(`/sensor_log/upload`, form, (data) => {
        let dataTable = insitu_log_handler(data as InSituLog);

        if (dataTable) {
          uploadData(dataTable);

          let data: { [key: string]: (number | string | Date)[] } = {
            ...dataTable,
          };
          data["timestamp"] = data["datetime"].map((d) =>
            new Date(d).toString(),
          );
          // BokehJS axis ticks hack
          data["datetime"] = data["datetime"].map(
            (d) => (d as number) - LOCAL_TIME_OFFSET,
          );
          source = new ColumnDataSource({
            data: data,
          });
          clearPlot();
          createGridPlot(source);
        }
      }).finally(() => {
        (ev.target as HTMLInputElement).value = "";
      });
    }
  }

  function uploadData(dataTable: { [key: string]: number[] }) {
    let currentTaskId = selectedTaskInfo[0]?.task_id;

    ApiClient.get(
      `/api/task/${currentTaskId}/sensor/last_timestamp`,
      (data) => {
        let lastDataTime = data ? Date.parse(data) : 0;
        let stIdx = dataTable["datetime"].findIndex((d) => d > lastDataTime);

        let filteredData: { [key: string]: number | string | Date }[] = [];
        for (let i = stIdx; i < dataTable["datetime"].length; i++) {
          let row: { [key: string]: number | string | Date } = {};
          Object.keys(dataTable).forEach((key) => {
            if (key === "datetime") {
              row[key] = dateToISOString(new Date(dataTable[key][i])) as string;
            } else {
              row[key] = dataTable[key][i];
            }
          });
          row["task_id"] = currentTaskId;
          filteredData.push(row);
        }

        ApiClient.post(`/api/task/${currentTaskId}/sensor`, filteredData, (_) =>
          toast.success("Data uploaded"),
        );
      },
    );
  }
</script>

{#if selectedTaskInfo.length > 0}
  <div class="flex w-full px-2">
    <div class="flex flex-column px-2 items-center gap-1.5">
      <Label class="min-w-[4em]" for="log_file">Log File</Label>
      <Input
        bind:this={logFileInput}
        id="log_file"
        type="file"
        accept=".csv,.txt"
        placeholder="Upload log file"
        onchange={onLogFileChanged}
      />
      <LogEditMenu
        disabled={selectedTaskInfo.length == 0}
        onClearLogData={() => {
          ApiClient.delete(
            `/api/task/${selectedTaskInfo[0]?.task_id}/sensor`,
            (_) => {
              toast.success("Data cleared");
              clearPlot();
            },
          );
        }}
      />
    </div>
  </div>
  <div class="w-full px-2">
    <div id="bokehjs-plot"></div>
  </div>
{/if}
