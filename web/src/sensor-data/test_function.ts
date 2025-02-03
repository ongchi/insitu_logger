export const criteria: { [id: string]: string } = {
  temp: "0.2",
  temp2: "0.2",
  cndct: "3%",
  spcndct: "3%",
  ph: "0.1",
  orp: "50",
  do_con: "0.3",
  do_sat: "10%",
};

// Rolling window function by value of array_data
// Note: The array_data should sorted in ascending order
function rolling_window(
  array_data: number[],
  width: number,
): [number, number][] {
  let result: [number, number][] = [];
  let li = 0; // left index of a window
  let ri = 0; // right index of a window

  while (ri < array_data.length) {
    if (array_data[ri] - array_data[li] < width) {
      ri++;
    } else {
      result.push([li, ri]);
      li++;
    }
  }

  return result;
}

// Test if difference of min and max values are within margin
function test_abs(x: number[], margin: number) {
  let min = Math.min(...x);
  let max = Math.max(...x);
  let mean = x.reduce((a, b) => a + b) / x.length;
  return max - mean < margin && mean - min < margin;
}

// Test if difference in percentage of min and max values are within margin
function test_relative(x: number[], margin: number) {
  let min = Math.min(...x);
  let max = Math.max(...x);
  let mean = x.reduce((a, b) => a + b) / x.length;
  return (max - mean) / mean < margin && (mean - min) / mean < margin;
}

export function test_sampling_dataframe(
  dataframe: { [index: string]: any[] },
  window_width: number,
) {
  let result: any = {};

  let window = rolling_window(dataframe["datetime"], window_width);
  result["datetime"] = window.map((range) => dataframe["datetime"][range[1]]);

  for (let key in criteria) {
    if (criteria[key].endsWith("%")) {
      result[key] = window.map((range) =>
        test_relative(
          dataframe[key].slice(range[0], range[1]),
          parseFloat(criteria[key].slice(0, -1)) / 100,
        ),
      );
    } else {
      result[key] = window.map((range) =>
        test_abs(
          dataframe[key].slice(range[0], range[1]),
          parseFloat(criteria[key]),
        ),
      );
    }
  }

  return result;
}

export function create_annotation_bounds(
  test_result: { [index: string]: any[] },
  purging_time: number,
) {
  let result: { [index: string]: [number, number][] } = {};
  let time_offset = purging_time + 1 * 3600 * 1000;
  let idx_offset = test_result["datetime"].findIndex((x) => x >= time_offset);

  for (let key in test_result) {
    if (key !== "datetime") {
      let prev_time = time_offset;
      let prev_pass_status = test_result[key][idx_offset];

      result[key] = [];
      for (let i = idx_offset; i < test_result["datetime"].length; i++) {
        let time = test_result["datetime"][i];
        let pass_status =
          test_result[key][Math.min(i + 1, test_result["datetime"].length - 1)]; // offset by 1 step
        if (pass_status !== prev_pass_status) {
          if (!prev_pass_status) result[key].push([prev_time, time]);
          prev_time = time;
          prev_pass_status = pass_status;
        }
      }
      if (!prev_pass_status)
        result[key].push([prev_time, test_result["datetime"].slice(-1)[0]]);
    }
  }

  return result;
}
