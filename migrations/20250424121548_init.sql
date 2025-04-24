-- Add migration script here
CREATE TABLE well (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT,
    comment TEXT
);

CREATE TABLE pump (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    comment TEXT
);

CREATE TABLE sample_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    variant TEXT,
    comment TEXT
);

CREATE TABLE people (
    id INTEGER NOT NULL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    done BOOLEAN DEFAULT FALSE,
    serial TEXT UNIQUE,
    well_id INTEGER NOT NULL,
    depth TEXT NOT NULL,
    FOREIGN KEY (well_id) REFERENCES well (id)
);

CREATE TABLE sample_set (
    task_id INTEGER NOT NULL,
    sample_type_id INTEGER NOT NULL,
    qty INTEGER DEFAULT 1 NOT NULL,
    FOREIGN KEY (task_id) REFERENCES task (id),
    FOREIGN KEY (sample_type_id) REFERENCES sample_type (id),
    PRIMARY KEY (task_id, sample_type_id)
);

CREATE TABLE task_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    calibration TEXT,
    purging_time DATETIME,
    water_level REAL,
    pump_id INTEGER,
    pump_depth REAL,
    pump_freq REAL,
    pump_rate REAL,
    hose_setup TEXT,
    sampling_time DATETIME,
    sample_wt_radium REAL,
    comment TEXT,
    FOREIGN KEY (task_id) REFERENCES task (id),
    FOREIGN KEY (pump_id) REFERENCES pump (id)
);

CREATE TABLE task_minuted_by (
    task_info_id INTEGER NOT NULL,
    people_id INTEGER NOT NULL,
    FOREIGN KEY (task_info_id) REFERENCES task_info (id) ON DELETE CASCADE,
    FOREIGN KEY (people_id) REFERENCES people (id),
    PRIMARY KEY (task_info_id, people_id)
);

CREATE TABLE task_sampled_by (
    task_info_id INTEGER NOT NULL,
    people_id INTEGER NOT NULL,
    FOREIGN KEY (task_info_id) REFERENCES task_info (id) ON DELETE CASCADE,
    FOREIGN KEY (people_id) REFERENCES people (id),
    PRIMARY KEY (task_info_id, people_id)
);

CREATE TABLE sensor_data (
    task_id INTEGER NOT NULL,
    "datetime" DATETIME NOT NULL,
    cndct REAL NOT NULL,
    temp_internal REAL NOT NULL,
    spcndct REAL NOT NULL,
    sa REAL,
    resis REAL,
    wtr_d REAL,
    tds REAL,
    turbidity REAL,
    ph REAL NOT NULL,
    ph_mv REAL,
    orp REAL NOT NULL,
    do_con REAL NOT NULL,
    do_sat REAL NOT NULL,
    ppo2 REAL,
    temp_sensor REAL,
    v REAL,
    batt INTEGER,
    pres_baro REAL,
    pres REAL,
    depth REAL,
    FOREIGN KEY (task_id) REFERENCES task (id)
);

CREATE TABLE sensor_metadata (
    task_id INTEGER PRIMARY KEY,
    meta JSONB,
    FOREIGN KEY (task_id) REFERENCES task (id)
)
