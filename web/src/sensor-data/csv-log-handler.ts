let COLUMN_NAME_MAPPING: { [key: string]: string } = {
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
  "(pH)": 1.0, "(mV)": 1.0,
  "(mg/L)": 1.0,
  "(%Sat)": 1.0,
  "(NTU)": 1.0,
  "(Torr)": 1.0,
  "(ohm-cm)": 1.0,
}

export function csvLogParser(csv: string): null | { [key: string]: number[] } {
  let content = csv.match(/[^\r\n]+/g);
  if (content) {
    let header = content[0];
    let filteredContent = content.filter((line) => line !== header);
    let columnNames = header.split(",");

    let sqlColNames: string[] = [];
    let unitModifiers: number[] = [];

    columnNames.forEach((name, i) => {
      Object.keys(COLUMN_NAME_MAPPING).forEach(key => {
        if (name.startsWith(key)) {
          sqlColNames.push(COLUMN_NAME_MAPPING[key]);
          let unit = name.replace(key, "").trim();
          if (unit === "") {
            unitModifiers.push(1.0)
          }
          else if (unit in UNIT_MODIFIERS) {
            unitModifiers.push(UNIT_MODIFIERS[unit]);
          } else {
            throw new Error(`Unknown unit: ${unit}`);
          }
        }
      })
      if (sqlColNames.length !== i + 1) {
        console.log(`Unknown column name: ${name}`);
        sqlColNames.push("");
        unitModifiers.push(0.0);
      }
    });

    let dataTable: { [key: string]: (number)[] } = {};
    filteredContent.forEach((line) => {
      let values = line.split(",");
      // The line data may be incomplete
      if (values.length === sqlColNames.length) {
        values.forEach((value, index) => {
          let colName = sqlColNames[index];
          let modifier = unitModifiers[index];
          if (colName === "datetime") {
            let date = Date.parse(value.replace("AM", " AM").replace("PM", " PM"));
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
      }
    });

    return dataTable;
  } else {
    return null
  }
}
