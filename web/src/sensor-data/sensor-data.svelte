<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import LogEditMenu from "./log-edit-menu.svelte";
  import { selectedTaskInfo } from "$lib/shared-variables.svelte";
  import { toast } from "svelte-sonner";
  import Plotly from "plotly.js-dist-min";
  import {
    criteria,
    create_annotation_bounds,
    test_sampling_dataframe,
  } from "./test_function.ts";
  import { insitu_log_handler } from "./sensor-log-handler.ts";
  import { type InSituLog } from "$lib/types.ts";
  import { dateToISOString } from "$lib/date-utils.ts";
  import { ApiClient } from "$lib/api-client";

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
  let plotData: { [key: string]: any[] } = $state({});

  let purgingTime = $derived(selectedTaskInfo[0]?.purging_time);
  let samplingTime = $derived(selectedTaskInfo[0]?.sampling_time);

  let logFileInput: any = $state();
  let isUpdatingZoom = false;

  $effect(() => {
    if (selectedTaskInfo.length > 0) {
      clearPlot();
      let currentTaskId = selectedTaskInfo[0]?.task_id;
      ApiClient.get(`/api/task/${currentTaskId}/sensor`, (data) => {
        if (data.length > 0) {
          plotData = createPlotData(data);
          createGridPlot(plotData);
        }
      });
    }
  });

  function clearPlot() {
    let plotDiv = document.getElementById("plotly-plot");
    if (plotDiv) plotDiv.innerHTML = "";
  }

  function createPlotData(data: any) {
    let transformedData: any = {};
    columns.forEach((key) => {
      if (key === "datetime") {
        transformedData["datetime"] = data.map((d: any) => new Date(d["datetime"]));
      } else {
        transformedData[key] = data.map((d: any) => d[key]);
      }
    });
    return transformedData;
  }

  function createGridPlot(data: { [key: string]: any[] }) {
    let plotDiv = document.getElementById("plotly-plot");
    if (!plotDiv) return;

    // Create a container for all plots
    plotDiv.innerHTML = "";
    const gridContainer = document.createElement("div");
    gridContainer.style.display = "grid";
    gridContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
    gridContainer.style.gap = "10px";
    gridContainer.style.width = "100%";
    plotDiv.appendChild(gridContainer);

    const plotKeys = columns.filter((k) => k !== "datetime");
    const plotDivs: HTMLElement[] = [];

    // Create plot containers
    plotKeys.forEach((key, idx) => {
      const div = document.createElement("div");
      div.id = `plot-${idx}`;
      div.style.height = "300px";
      gridContainer.appendChild(div);
      plotDivs.push(div);
    });

    // Get quality control annotations
    let annotationBounds: { [key: string]: [number, number][] } = {};
    if (purgingTime) {
      let numericData: { [key: string]: any[] } = { ...data };
      numericData["datetime"] = data["datetime"].map((d: Date) => d.getTime());
      let testResult = test_sampling_dataframe(numericData, 5 * 60 * 1000);
      annotationBounds = create_annotation_bounds(
        testResult,
        purgingTime.getTime(),
      );
    }

    // Create each plot
    plotKeys.forEach((key, idx) => {
      const shapes: any[] = [];

      // Add time markers
      if (purgingTime) {
        // Green line - purging start
        shapes.push({
          type: "line",
          x0: purgingTime,
          x1: purgingTime,
          y0: 0,
          y1: 1,
          yref: "paper",
          line: { color: "green", width: 1 },
        });

        // Gray line - stabilization (1 hour after purging)
        const stabilizationTime = new Date(
          purgingTime.getTime() + 1 * 3600 * 1000,
        );
        shapes.push({
          type: "line",
          x0: stabilizationTime,
          x1: stabilizationTime,
          y0: 0,
          y1: 1,
          yref: "paper",
          line: { color: "gray", width: 1 },
        });
      }

      if (samplingTime) {
        // Red line - sampling time
        shapes.push({
          type: "line",
          x0: samplingTime,
          x1: samplingTime,
          y0: 0,
          y1: 1,
          yref: "paper",
          line: { color: "red", width: 1 },
        });
      }

      // Add quality control box annotations
      if (key in annotationBounds && annotationBounds[key].length > 0) {
        annotationBounds[key].forEach((bounds) => {
          shapes.push({
            type: "rect",
            x0: new Date(bounds[0]),
            x1: new Date(bounds[1]),
            y0: 0,
            y1: 1,
            yref: "paper",
            fillcolor: "#D55E00",
            opacity: 0.3,
            line: { width: 0 },
          });
        });
      }

      const trace = {
        x: data["datetime"],
        y: data[key],
        type: "scatter",
        mode: "lines",
        line: { width: 2 },
        hovertemplate: "%{x}<br>" + key + ": %{y:.4f}<extra></extra>",
      };

      const layout = {
        title: {
          text: criteria[key]
            ? `${SQL_TO_FULL_COLUMN_NAME[key]} (±${criteria[key]})`
            : SQL_TO_FULL_COLUMN_NAME[key],
          font: { size: 12 },
        },
        xaxis: {
          type: "date",
          showgrid: true,
        },
        yaxis: {
          showgrid: true,
        },
        margin: { l: 60, r: 20, t: 40, b: 40 },
        hovermode: "x",
        shapes: shapes,
        showlegend: false,
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ["lasso2d", "select2d"],
      };

      Plotly.newPlot(plotDivs[idx], [trace], layout, config);

      // Sync zoom/pan across all plots
      plotDivs[idx].on("plotly_relayout", (eventData: any) => {
        if (isUpdatingZoom) return;
        isUpdatingZoom = true;

        // Check if this is a zoom/pan event
        if (eventData["xaxis.range[0]"] !== undefined) {
          const xRange = [eventData["xaxis.range[0]"], eventData["xaxis.range[1]"]];

          // Update all other plots
          plotDivs.forEach((div, otherIdx) => {
            if (otherIdx !== idx) {
              Plotly.relayout(div, {
                "xaxis.range[0]": xRange[0],
                "xaxis.range[1]": xRange[1],
              });
            }
          });
        } else if (eventData["xaxis.autorange"] === true) {
          // Handle reset/autoscale
          plotDivs.forEach((div, otherIdx) => {
            if (otherIdx !== idx) {
              Plotly.relayout(div, { "xaxis.autorange": true });
            }
          });
        }

        setTimeout(() => {
          isUpdatingZoom = false;
        }, 100);
      });

      // Sync hover across all plots
      plotDivs[idx].on("plotly_hover", (eventData: any) => {
        const point = eventData.points[0];
        const xValue = point.x;

        plotDivs.forEach((div, otherIdx) => {
          if (otherIdx !== idx) {
            Plotly.Fx.hover(div, { xval: xValue });
          }
        });
      });

      plotDivs[idx].on("plotly_unhover", () => {
        plotDivs.forEach((div, otherIdx) => {
          if (otherIdx !== idx) {
            Plotly.Fx.unhover(div);
          }
        });
      });
    });
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

          let plotDataFromFile: { [key: string]: any[] } = {};
          Object.keys(dataTable).forEach((key) => {
            if (key === "datetime") {
              plotDataFromFile[key] = dataTable[key].map(
                (d) => new Date(d as number),
              );
            } else {
              plotDataFromFile[key] = dataTable[key];
            }
          });

          plotData = plotDataFromFile;
          clearPlot();
          createGridPlot(plotData);
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
    <div id="plotly-plot"></div>
  </div>
{/if}
