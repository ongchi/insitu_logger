use axum::extract::{Json, Path};
use axum::Extension;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

use super::{ApiContext, Error};

#[derive(Deserialize, Serialize)]
pub struct TaskSummary {
    id: i64,
    done: Option<bool>,
    serial: Option<String>,
    well_id: Option<i64>,
    depth: Option<String>,
    sample_set: Option<String>,
    sampling_time: Option<NaiveDateTime>,
    comment: Option<String>,
}

pub async fn list_task_summaries(
    ctx: Extension<ApiContext>,
) -> Result<Json<Vec<TaskSummary>>, Error> {
    let task_summaries = sqlx::query_as!(
        TaskSummary,
        "SELECT id, done, serial, well_id, depth, sample_set, sampling_time, comment FROM task_summary"
    )
    .fetch_all(&ctx.db)
    .await?;
    Ok(Json(task_summaries))
}

#[derive(Deserialize)]
pub struct NewTask {
    well_id: i64,
    depth: String,
}

pub async fn insert_task(
    ctx: Extension<ApiContext>,
    Json(new_task): Json<NewTask>,
) -> Result<Json<i64>, Error> {
    let id = sqlx::query!(
        "INSERT INTO task (well_id, depth) VALUES ($1, $2) RETURNING id",
        new_task.well_id,
        new_task.depth,
    )
    .fetch_one(&ctx.db)
    .await?;

    match id.id {
        Some(id) => Ok(Json(id)),
        None => {
            tracing::error!("Failed to insert task");
            Err(anyhow::anyhow!("Failed to insert task").into())
        }
    }
}

pub async fn delete_task(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
) -> Result<(), Error> {
    sqlx::query!("DELETE FROM task WHERE id = $1", task_id)
        .execute(&ctx.db)
        .await?;
    Ok(())
}

pub async fn update_task(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
    Json(update): Json<serde_json::Value>,
) -> Result<(), Error> {
    tracing::debug!("Update task: {:?}", update);

    match update {
        serde_json::Value::Object(data) => {
            let mut tx = ctx.db.begin().await?;

            for (key, value) in data {
                match key.as_str() {
                    "done" => {
                        let value = value.as_bool().ok_or_else(|| {
                            anyhow::anyhow!("Invalid value for done: {:?}", value)
                        })?;
                        sqlx::query!("UPDATE task SET done = $1 WHERE id = $2", value, task_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "serial" => {
                        let value = value.as_str().ok_or_else(|| {
                            anyhow::anyhow!("Invalid value for serial: {:?}", value)
                        })?;
                        sqlx::query!("UPDATE task SET serial = $1 WHERE id = $2", value, task_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "well_id" => {
                        let value = value.as_i64().ok_or_else(|| {
                            anyhow::anyhow!("Invalid value for well_id: {:?}", value)
                        })?;
                        sqlx::query!("UPDATE task SET well_id = $1 WHERE id = $2", value, task_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    "depth" => {
                        let value = value.as_str().ok_or_else(|| {
                            anyhow::anyhow!("Invalid value for depth: {:?}", value)
                        })?;
                        sqlx::query!("UPDATE task SET depth = $1 WHERE id = $2", value, task_id)
                            .execute(&mut *tx)
                            .await?;
                    }
                    _ => {
                        return Err(anyhow::anyhow!("Invalid column: {:?}", key).into());
                    }
                }
            }

            tx.commit().await?;
        }
        _ => return Err(anyhow::anyhow!("Invalid value").into()),
    }

    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct SampleSet {
    id: i64,
    qty: i64,
}

pub async fn get_sample_set(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
) -> Result<Json<Vec<SampleSet>>, Error> {
    let sample_set = sqlx::query_as!(
        SampleSet,
        "SELECT sample_type_id AS id, qty FROM sample_set WHERE task_id = $1 ORDER BY sample_type_id ASC",
        task_id
    )
    .fetch_all(&ctx.db)
    .await?;

    Ok(Json(sample_set))
}

pub async fn update_sample_set(
    ctx: Extension<ApiContext>,
    Path(task_id): Path<i64>,
    Json(update_items): Json<Vec<SampleSet>>,
) -> Result<(), Error> {
    let mut tx = ctx.db.begin().await?;

    for update in update_items {
        if update.qty == 0 {
            sqlx::query!(
                "DELETE FROM sample_set WHERE task_id = $1 AND sample_type_id = $2",
                task_id,
                update.id
            )
            .execute(&mut *tx)
            .await?;
        } else {
            sqlx::query!(
                r#"
                INSERT INTO
                    sample_set (task_id, sample_type_id, qty)
                VALUES
                    ($1, $2, $3)
                ON CONFLICT
                    (task_id, sample_type_id)
                DO UPDATE SET
                    qty = $3
                WHERE
                    task_id = $1 AND sample_type_id = $2
                "#,
                task_id,
                update.id,
                update.qty
            )
            .execute(&mut *tx)
            .await?;
        }
    }

    tx.commit().await?;

    Ok(())
}
