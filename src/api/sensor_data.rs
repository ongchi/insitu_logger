use std::io::Cursor;

use axum::extract::{Extension, Multipart, Path};
use axum::Json;
use chrono::NaiveDateTime;
use insitu_log_reader::{InSituLogError, InSituLogReader};
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

pub async fn insitu_log_handler(mut multipart: Multipart) -> Result<Json<InSituLogReader>, Error> {
    let log = if let Some(field) = multipart.next_field().await.unwrap() {
        let file_name = field.file_name().unwrap_or("").to_string();
        let data = field.bytes().await.unwrap();
        let ext = file_name.split('.').last().unwrap_or("");

        let mut reader = Cursor::new(data);

        match ext {
            "csv" => InSituLogReader::from_csv(&mut reader)?,
            "txt" => InSituLogReader::from_txt(&mut reader)?,
            "zip" => InSituLogReader::from_zipped_html(&mut reader)?,
            _ => return Err(InSituLogError::InvalidData)?,
        }
    } else {
        return Err(InSituLogError::InvalidData)?;
    };

    Ok(Json(log))
}

pub async fn get_latest_timestamp(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
) -> Result<Json<Option<NaiveDateTime>>, Error> {
    let record = sqlx::query!(
        r#"
        SELECT datetime
        FROM sensor_data
        WHERE task_id = $1
        ORDER BY datetime DESC
        LIMIT 1
        "#,
        task_id
    )
    .fetch_optional(&ctx.db)
    .await?;

    Ok(Json(record.map(|r| r.datetime)))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SensorRecord {
    task_id: i64,
    #[serde(with = "super::serde::iso8601")]
    datetime: NaiveDateTime,
    cndct: f64,
    temp_internal: f64,
    spcndct: f64,
    sa: Option<f64>,
    resis: Option<f64>,
    wtr_d: Option<f64>,
    tds: Option<f64>,
    turbidity: Option<f64>,
    ph: f64,
    ph_mv: Option<f64>,
    orp: f64,
    do_con: f64,
    do_sat: f64,
    ppo2: Option<f64>,
    temp_sensor: Option<f64>,
    v: Option<f64>,
    batt: Option<i64>,
    pres_baro: Option<f64>,
    pres: Option<f64>,
    depth: Option<f64>,
}

pub async fn get_sensor_data(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
) -> Result<Json<Vec<SensorRecord>>, Error> {
    let records = sqlx::query_as!(
        SensorRecord,
        r#"
        SELECT
            task_id, datetime, cndct, temp_internal, spcndct, sa, resis,
            wtr_d, tds, turbidity, ph, ph_mv, orp, do_con, do_sat,
            ppo2, temp_sensor, v, batt, pres_baro, pres, depth
        FROM sensor_data
        WHERE task_id = $1
        ORDER BY datetime ASC
        "#,
        task_id
    )
    .fetch_all(&ctx.db)
    .await?;

    Ok(Json(records))
}

pub async fn insert_sensor_data(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
    Json(sensor_data): Json<Vec<SensorRecord>>,
) -> Result<(), Error> {
    let mut tx = ctx.db.begin().await?;

    for sensor_record in sensor_data {
        if sensor_record.task_id != task_id {
            return Err(anyhow::anyhow!("Invalid Data: Task ID mismatch").into());
        }

        tracing::info!("Inserting sensor data: {:?}", sensor_record);

        sqlx::query!(
            r#"
            INSERT INTO
            sensor_data
            (
                task_id, datetime, cndct, temp_internal, spcndct, sa, resis,
                wtr_d, tds, turbidity, ph, ph_mv, orp, do_con, do_sat,
                ppo2, temp_sensor, v, batt, pres_baro, pres, depth
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            "#,
            task_id,
            sensor_record.datetime,
            sensor_record.cndct,
            sensor_record.temp_internal,
            sensor_record.spcndct,
            sensor_record.sa,
            sensor_record.resis,
            sensor_record.wtr_d,
            sensor_record.tds,
            sensor_record.turbidity,
            sensor_record.ph,
            sensor_record.ph_mv,
            sensor_record.orp,
            sensor_record.do_con,
            sensor_record.do_sat,
            sensor_record.ppo2,
            sensor_record.temp_sensor,
            sensor_record.v,
            sensor_record.batt,
            sensor_record.pres_baro,
            sensor_record.pres,
            sensor_record.depth,
        ).execute(&mut *tx).await?;
    }

    tx.commit().await?;

    Ok(())
}

pub async fn clear_sensor_data(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<u32>,
) -> Result<(), Error> {
    sqlx::query!("DELETE FROM sensor_data WHERE task_id = $1", task_id)
        .execute(&ctx.db)
        .await?;

    Ok(())
}
