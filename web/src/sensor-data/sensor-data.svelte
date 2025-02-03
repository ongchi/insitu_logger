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
  import { BoxAnnotation, HoverTool } from "@bokeh/bokehjs/build/js/lib/models";
  import {
    criteria,
    create_annotation_bounds,
    test_sampling_dataframe,
  } from "./test_function.ts";

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
  let columns = Object.keys(SQL_TO_FULL_COLUMN_NAME);

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
        .select(columns.join(","))
        .eq("task_id", currentTaskId)
        .order("datetime")
        .then(({ data, error }) => {
          if (error) {
            toast.error(error.message);
          } else {
            let source = createColumnDataSource(data);
            createGridPlot(source);

            if (purgingTime) {
              plots.forEach((p) => {
                p.vspan(purgingTime, { line_width: 2, line_color: "green" });
                p.vspan(purgingTime + 1 * 3600 * 1000, {
                  line_width: 2,
                  line_color: "gray",
                });
              });
            }

            if (samplingTime) {
              plots.forEach((p) =>
                p.vspan(samplingTime, { line_width: 2, line_color: "red" }),
              );
            }

            if (purgingTime) {
              let test_result = test_sampling_dataframe(
                source.data as any,
                5 * 60 * 1000,
              );
              let annotation_bounds = create_annotation_bounds(
                test_result,
                purgingTime,
              );
              columns.forEach((key, idx) => {
                if (
                  key in annotation_bounds &&
                  annotation_bounds[key].length > 0
                ) {
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
        let datetime = data.map((d: any) => Date.parse(d["datetime"]));
        let timestamp = datetime.map((d: any) => new Date(d).toString());
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
