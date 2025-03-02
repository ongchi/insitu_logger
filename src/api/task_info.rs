use std::collections::HashMap;

use axum::extract::{Json, Path};
use axum::Extension;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

pub async fn get_last_timestamp(
    ctx: Extension<ApiContext>,
) -> Result<Json<Option<NaiveDateTime>>, Error> {
    let last_timestamp = sqlx::query!(
        r#"
        SELECT
            sampling_time
        FROM
            task_info
        WHERE
            sampling_time IS NOT NULL
        ORDER BY
            id
        DESC
        LIMIT 1
        "#
    )
    .fetch_optional(&ctx.db)
    .await?;

    Ok(Json(
        last_timestamp.map(|row| row.sampling_time).unwrap_or(None),
    ))
}

#[derive(Serialize, Deserialize)]
pub struct TaskInfo {
    id: i64,
    task_id: i64,
    calibration: Option<String>,
    #[serde(with = "super::serde::iso8601_option")]
    purging_time: Option<NaiveDateTime>,
    water_level: Option<f64>,
    pump_id: Option<i64>,
    pump_depth: Option<f64>,
    pump_freq: Option<f64>,
    pump_rate: Option<f64>,
    hose_setup: Option<String>,
    #[serde(with = "super::serde::iso8601_option")]
    sampling_time: Option<NaiveDateTime>,
    sample_wt_radium: Option<f64>,
    comment: Option<String>,
}

pub async fn get_task_info(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
) -> Result<Json<Vec<TaskInfo>>, Error> {
    let task_info = sqlx::query_as!(
        TaskInfo,
        r#"
        SELECT
            id,
            task_id,
            calibration,
            purging_time,
            water_level,
            pump_id,
            pump_depth,
            pump_freq,
            pump_rate,
            hose_setup,
            sampling_time,
            sample_wt_radium,
            comment
        FROM
            task_info
        WHERE
            task_id = $1
        ORDER BY
            id
        DESC
        "#,
        task_id
    )
    .fetch_all(&ctx.db)
    .await?;

    Ok(Json(task_info))
}

#[derive(Serialize, Deserialize)]
pub struct TaskInfoToPeopleRelation {
    task_info_id: i64,
    people_id: i64,
}

pub async fn get_minuted_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
) -> Result<Json<Vec<TaskInfoToPeopleRelation>>, Error> {
    let task_info_to_people_relation = sqlx::query_as!(
        TaskInfoToPeopleRelation,
        r#"
        SELECT
            task_info_id,
            people_id
        FROM
           task_minuted_by 
        WHERE
            task_info_id = $1
        ORDER BY
            people_id
        DESC
        "#,
        task_info_id
    )
    .fetch_all(&ctx.db)
    .await?;

    Ok(Json(task_info_to_people_relation))
}

#[derive(Serialize, Deserialize)]
pub struct PeopleId {
    id: i64,
}

pub async fn add_minuted_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
    Json(people_id): Json<PeopleId>,
) -> Result<(), Error> {
    sqlx::query!(
        r#"
        INSERT INTO
            task_minuted_by (task_info_id, people_id)
        VALUES
            ($1, $2)
        "#,
        task_info_id,
        people_id.id
    )
    .execute(&ctx.db)
    .await?;

    Ok(())
}

pub async fn delete_minuted_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id, people_id)): Path<(i64, i64, i64)>,
) -> Result<(), Error> {
    sqlx::query!(
        r#"
        DELETE FROM task_minuted_by
        WHERE task_info_id = $1 AND people_id = $2
        "#,
        task_info_id,
        people_id
    )
    .execute(&ctx.db)
    .await?;

    Ok(())
}

pub async fn get_sampled_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
) -> Result<Json<Vec<TaskInfoToPeopleRelation>>, Error> {
    let task_info_to_people_relation = sqlx::query_as!(
        TaskInfoToPeopleRelation,
        r#"
        SELECT
            task_info_id,
            people_id
        FROM
           task_sampled_by 
        WHERE
            task_info_id = $1
        ORDER BY
            task_info_id
        DESC
        "#,
        task_info_id
    )
    .fetch_all(&ctx.db)
    .await?;

    Ok(Json(task_info_to_people_relation))
}

pub async fn add_sampled_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
    Json(people_id): Json<PeopleId>,
) -> Result<(), Error> {
    sqlx::query!(
        r#"
        INSERT INTO
            task_sampled_by (task_info_id, people_id)
        VALUES
            ($1, $2)
        "#,
        task_info_id,
        people_id.id
    )
    .execute(&ctx.db)
    .await?;

    Ok(())
}

pub async fn delete_sampled_by(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id, people_id)): Path<(i64, i64, i64)>,
) -> Result<(), Error> {
    sqlx::query!(
        r#"
        DELETE FROM task_sampled_by
        WHERE task_info_id = $1 AND people_id = $2
        "#,
        task_info_id,
        people_id
    )
    .execute(&ctx.db)
    .await?;

    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct NewTaskInfo {
    task_id: i64,
    #[serde(default)]
    calibration: Option<String>,
    #[serde(default, with = "super::serde::iso8601_option")]
    purging_time: Option<NaiveDateTime>,
    #[serde(default)]
    water_level: Option<f64>,
    #[serde(default)]
    pump_id: Option<i64>,
    #[serde(default)]
    pump_depth: Option<f64>,
    #[serde(default)]
    pump_freq: Option<f64>,
    #[serde(default)]
    pump_rate: Option<f64>,
    #[serde(default)]
    hose_setup: Option<String>,
    #[serde(default, with = "super::serde::iso8601_option")]
    sampling_time: Option<NaiveDateTime>,
    #[serde(default)]
    sample_wt_radium: Option<f64>,
    #[serde(default)]
    comment: Option<String>,
}

pub async fn insert_task_info(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
    Json(task_info): Json<NewTaskInfo>,
) -> Result<Json<Option<i64>>, Error> {
    let task_info_id = sqlx::query!(
        r#"
        INSERT INTO task_info (
            task_id,
            calibration,
            purging_time,
            water_level,
            pump_id,
            pump_depth,
            pump_freq,
            pump_rate,
            hose_setup,
            sampling_time,
            sample_wt_radium,
            comment
        )
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
        "#,
        task_id,
        task_info.calibration,
        task_info.purging_time,
        task_info.water_level,
        task_info.pump_id,
        task_info.pump_depth,
        task_info.pump_freq,
        task_info.pump_rate,
        task_info.hose_setup,
        task_info.sampling_time,
        task_info.sample_wt_radium,
        task_info.comment
    )
    .fetch_one(&ctx.db)
    .await?;

    Ok(Json(task_info_id.id))
}

pub async fn delete_task_info(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
) -> Result<(), Error> {
    sqlx::query!("DELETE FROM task_info WHERE id = $1", task_info_id)
        .execute(&ctx.db)
        .await?;

    Ok(())
}

pub async fn update_task_info(
    ctx: Extension<ApiContext>,
    Path((_, task_info_id)): Path<(i64, i64)>,
    Json(task_info): Json<HashMap<String, serde_json::Value>>,
) -> Result<(), Error> {
    let mut tx = ctx.db.begin().await?;

    for (key, val) in task_info {
        match key.as_str() {
            "calibration" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET calibration = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "purging_time" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET purging_time = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "water_level" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET water_level = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "pump_id" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET pump_id = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "pump_depth" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET pump_depth = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "pump_freq" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET pump_freq = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "pump_rate" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET pump_rate = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "hose_setup" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET hose_setup = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "sampling_time" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET sampling_time = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "sample_wt_radium" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET sample_wt_radium = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "comment" => {
                let val = val.as_str();
                sqlx::query!(
                    "UPDATE task_info SET comment = $1 WHERE id = $2",
                    val,
                    task_info_id
                )
                .execute(&mut *tx)
                .await?;
            }
            _ => {
                return Err(anyhow::anyhow!("Invalid Data").into());
            }
        }
    }

    tx.commit().await?;

    Ok(())
}
