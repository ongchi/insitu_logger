import { type InSituLog } from "$lib/types.ts";

let COLUMN_NAME_MAPPING: { [key: string]: string } = {
  // csv log column names
  "Date/Time": "datetime",
  "Temp": "temp",
  "Pres": "pres",
  "Depth": "depth",
  "CNDCT": "cndct",
  "SPCNDCT": "spcndct",
  "SA": "sa",
  "TDS": "tds",
  "pH": "ph",
  "ORP": "orp",
  "DO(con)": "do_con",
  "DO(%sat)": "do_sat",
  "Turbidity": "turbidity",
  "PPO2": "ppo2",
  "Batt Perc(%)": "batt",
  "R": "resis",
  // txt dump column names
  "Date and Time": "datetime",
  "Temperature": "temp",
  "External Voltage": "v",
  "Battery Percentage (%)": "batt",
  "Barometric Pressure": "pres_baro",
  "Pressure": "pres",
  "Dissolved Oxygen (concentration)": "do_con",
  "Partial Pressure Oxygen": "ppo2",
  "pH(mV)": "ph_mv",
  "Dissolved Oxygen (%saturation)": "do_sat",
  "Oxidation Reduction Potential (ORP)": "orp",
  "Actual Conductivity": "cndct",
  "Specific Conductivity": "spcndct",
  "Salinity": "sa",
  "Resistivity": "resis",
  "Water Density": "wtr_d",
  "Total Dissolved Solids": "tds",
}

let UNIT_MODIFIERS: { [key: string]: number } = {
  "(C)": 1.0,
  "(PSI)": 1.0,
  "(mmHg)": 1.0 / 51.7149,
  "(m)": 1.0,
  "(ft)": 0.3048,
  "(µS/cm)": 1.0,
  "(mS/cm)": 1000.0,
  "(PSU)": 1.0,
  "(ppm)": 1.0,
  "(ppt)": 1000.0,
  "(pH)": 1.0,
  "(mV)": 1.0,
  "(mg/L)": 1.0,
  "(%Sat)": 1.0,
  "(NTU)": 1.0,
  "(Torr)": 1.0,
  "(ohm-cm)": 1.0,
  "(V)": 1.0,
  "(g/cm3)": 1.0,
}

export function insitu_log_handler(log: InSituLog): { [key: string]: number[] } {
  let content = log.log_data;

  let columnNames = Object.keys(content[0]);

  let sqlColNames: string[] = [];
  let unitModifiers: number[] = [];

  columnNames.forEach((name, i) => {
    Object.keys(COLUMN_NAME_MAPPING).forEach(key => {
      if (name === key || name.replace(/\s?\([^\)]*\)$/, '') === key) {
        sqlColNames.push(COLUMN_NAME_MAPPING[key]);
        let unit = name.replace(key, "").trim();
        if (unit === "") {
          unitModifiers.push(1.0)
        } else if (unit in UNIT_MODIFIERS) {
          unitModifiers.push(UNIT_MODIFIERS[unit]);
        } else {
          throw new Error(`Unknown unit: ${unit}`);
        }
      }
    })
    if (sqlColNames.length !== i + 1) {
      sqlColNames.push("");
      unitModifiers.push(0.0);
    }
  });

  let dataTable: { [key: string]: (number)[] } = {};
  content.forEach((row: any) => {
    columnNames.forEach((name, index) => {
      let value = row[name];
      let colName = sqlColNames[index];
      let modifier = unitModifiers[index];
      if (colName === "datetime") {
        // The datetime from the insitu log is in UTC,
        // so we need to convert it to local time.
        let date = Date.parse(value) - (new Date()).getTimezoneOffset() * 60 * 1000;
        if (colName in dataTable) {
          dataTable[colName].push(date);
        } else {
          dataTable[colName] = [date];
        }
      } else if (colName !== "") {
        if (colName in dataTable) {
          dataTable[colName].push(parseFloat(value) * modifier);
        } else {
          dataTable[colName] = [parseFloat(value) * modifier];
        }
      }
    });
  });

  return dataTable
}
