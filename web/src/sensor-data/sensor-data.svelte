<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { pgClient, selectedTaskInfo } from "$lib/shared-variables.svelte";
  import { toast } from "svelte-sonner";
  import { ColumnDataSource } from "@bokeh/bokehjs";
  import {
    Figure,
    figure,
    show,
    gridplot,
  } from "@bokeh/bokehjs/build/js/lib/api/plotting";
  import { HoverTool } from "@bokeh/bokehjs/build/js/lib/models";

  let SQL_TO_FULL_COLUMN_NAME: { [id: string]: string } = {
    datetime: "Date and Time",
    cndct: "Actual Conductivity (µS/cm)",
    temp: "Temperature (C)",
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
    temp2: "Temperature (C).1",
    v: "External Voltage (V)",
    batt: "Battery Percentage (%)",
    pres_baro: "Barometric Pressure (PSI)",
    pres: "Pressure (PSI)",
    depth: "Depth (m)",
  };

  function test_abs(x: number[], margin = 0.0) {
    let min = Math.min(...x);
    let max = Math.max(...x);
    let mean = x.reduce((a, b) => a + b) / x.length;
    return max - mean < margin && mean - min < margin;
  }

  function test_relative(x: number[], margin = 0.0) {
    let min = Math.min(...x);
    let max = Math.max(...x);
    let mean = x.reduce((a, b) => a + b) / x.length;
    return (max - mean) / mean < margin && (mean - min) / mean < margin;
  }

  let TEST_FN = {
    temp: (x: number[]) => test_abs(x, 0.2),
    temp2: (x: number[]) => test_abs(x, 0.2),
    cndct: (x: number[]) => test_relative(x, 0.03),
    spcndct: (x: number[]) => test_relative(x, 0.03),
    ph: (x: number[]) => test_abs(x, 0.1),
    orp: (x: number[]) => test_abs(x, 50.0),
    do_con: (x: number[]) => test_abs(x, 0.3),
    do_sat: (x: number[]) => test_relative(x, 0.1),
  };
  let TEST_ERR: { [id: string]: string } = {
    temp: "0.2",
    temp2: "0.2",
    cndct: "3%",
    spcndct: "3%",
    ph: "0.1",
    orp: "50",
    do_con: "0.3",
    do_sat: "10%",
  };

  let plots: Figure[] = $state([]);
  let purgingTime = $derived(
    (() => {
      let purgingTimeStr = selectedTaskInfo[0]?.purging_time;
      return purgingTimeStr ? Date.parse(purgingTimeStr) : null;
    })(),
  );
  let samplingTime = $derived(
    (() => {
      let samplingTimeStr = selectedTaskInfo[0]?.sampling_time;
      return samplingTimeStr ? Date.parse(samplingTimeStr) : null;
    })(),
  );

  $effect(() => {
    if (selectedTaskInfo.length > 0) {
      clearPlot();
      let currentTaskId = selectedTaskInfo[0]?.task_id;
      pgClient
        .from("sensor_data")
        .select(Object.keys(SQL_TO_FULL_COLUMN_NAME).join(","))
        .eq("task_id", currentTaskId)
        .then(({ data, error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            createGridPlot(data);

            if (purgingTime) {
              plots.forEach((p) => {
                p.vspan(purgingTime + 8 * 3600 * 1000, {
                  line_width: 2,
                  line_color: "green",
                });
                p.vspan(purgingTime + 9 * 3600 * 1000, {
                  line_width: 2,
                  line_color: "gray",
                });
              });
            }

            if (samplingTime) {
              plots.forEach((p) =>
                p.vspan(samplingTime + 8 * 3600 * 1000, {
                  line_width: 2,
                  line_color: "red",
                }),
              );
            }
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
    Object.keys(SQL_TO_FULL_COLUMN_NAME).forEach((key) => {
      if (key === "datetime") {
        // FIXME: This is a hack to map utc to local time
        let datetime = data.map(
          (d: any) => Date.parse(d["datetime"]) + 16 * 3600 * 1000,
        );
        let timestamp = datetime.map((d: any) =>
          new Date(d - 8 * 3600 * 1000).toString(),
        );
        transformedData["datetime"] = datetime;
        transformedData["timestamp"] = timestamp;
      } else {
        transformedData[key] = data.map((d: any) => d[key]);
      }
    });
    return new ColumnDataSource({
      data: transformedData,
    });
  }

  function createGridPlot(plot_data: any) {
    const source = createColumnDataSource(plot_data);

    plots = Object.keys(SQL_TO_FULL_COLUMN_NAME)
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
          title: TEST_ERR[key]
            ? `${SQL_TO_FULL_COLUMN_NAME[key]} (±${TEST_ERR[key]})`
            : SQL_TO_FULL_COLUMN_NAME[key],
          sizing_mode: "stretch_width",
          height: 300,
          x_axis_type: "datetime",
        });
        plot.add_tools(hover);

        hover.renderers = [
          plot.line({ field: "datetime" }, { field: key }, { source }),
        ];

        return plot;
      });

    // Link x_range of all plots
    plots.forEach((p) => {
      p.x_range = plots[0].x_range;
    });

    let grid = gridplot(plots, { sizing_mode: "stretch_width", ncols: 4 });
    show(grid, "#bokehjs-plot");
  }
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
                clearPlot();
              }
            });
        }}>Clear</Button
      >
    </div>
  </div>
  <div class="w-full px-2">
    <div id="bokehjs-plot"></div>
  </div>
{/if}
